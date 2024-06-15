import { Component, ViewChild, OnInit, inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Query, Unsubscribe, and, getDocs, limit, onSnapshot, or, orderBy, query, where } from 'firebase/firestore';
import { SessionService } from '../../session.service';
import { plainToInstance } from 'class-transformer';
import { OrderUi, Resource, ResourcePlanningUi, ResourceType } from 'ts-altea-model';
import { ArrayHelper, DateHelper, ObjectHelper } from 'ts-common';
import { ResourceService } from '../sql';
import * as _ from "lodash";

@Injectable({
  providedIn: 'root'
})
export class OrderFirestoreService {
  private firestore: Firestore = inject(Firestore)

  orders$: Observable<any[]>

  resources: Resource[] = null

  constructor(protected sessionSvc: SessionService, protected resourceSvc: ResourceService) { }


  getOrders() {
    const aCollection = collection(this.firestore, "branches", this.sessionSvc.branchId, "orders")
    this.orders$ = collectionData(aCollection)

    this.orders$.subscribe(orders => {
      console.warn('========= orders from FIRESTORE =================')

      const ordersUi = plainToInstance(OrderUi, orders)

      console.error(ordersUi)


    });
  }

  async getOrderUisBetween$(start: Date, end: Date): Promise<OrderUi[]> {


    const orderCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "orders")

    const startNum = DateHelper.yyyyMMddhhmmss(start)
    const endNum = DateHelper.yyyyMMddhhmmss(end)

    const qry = query(orderCol, and(where("start", ">=", startNum), where("start", "<", endNum)), orderBy('start', 'asc'))  // , limit(10)


    const querySnapshot = await getDocs(qry);

    const orderUis = querySnapshot.docs.map(doc => {
      const obj = doc.data()
      const orderUi = plainToInstance(OrderUi, obj)
      return orderUi
    }
    )

    return orderUis
  }

  async prepareFireStoreQuery(start: Date, end: Date): Promise<Query> {

    if (this.resources == null) // the local cached resources will be mapped later with orderUi.planning.resource
      this.resources = await this.resourceSvc.getAllForBranch$()

    const orderCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "orders")

    const startNum = DateHelper.yyyyMMddhhmmss(start)
    const endNum = DateHelper.yyyyMMddhhmmss(end)

    const qry = query(orderCol, and(where("start", ">=", startNum), where("start", "<", endNum)), orderBy('start', 'asc'))  // , limit(10)

    return qry
  }


  filterPlannings(planningUis: ResourcePlanningUi[], types: ResourceType[], orResourceIds: string[]): ResourcePlanningUi[] {

    if (ArrayHelper.IsEmpty(planningUis))
      return []


    let filteredByType: ResourcePlanningUi[] = [], filteredByResourceId: ResourcePlanningUi[] = []

    if (ArrayHelper.NotEmpty(types))
      filteredByType = planningUis.filter(planUi => types.indexOf((planUi.resource as Resource)?.type) >= 0)

    if (ArrayHelper.NotEmpty(orResourceIds))
      filteredByResourceId = planningUis.filter(planUi => orResourceIds.indexOf(planUi.resource?.id) >= 0)

    let result: ResourcePlanningUi[] = _.union(filteredByType, filteredByResourceId)




    return result
  }


  /** An order can have multiple plannings for same client (if client requested multiple services)
   * In the agenda we want to see just 1 block (we don't want to see multiple smaller blocks) 
   * 
   * Here we assume planningUis are for same order & resource
   */
  groupSamePlannings(planningUis: ResourcePlanningUi[]): ResourcePlanningUi {

    if (ArrayHelper.IsEmpty(planningUis))
      return null

    var first = planningUis[0]

    if (planningUis.length == 1)
      return first

    // since there is a circular reference order.plannings.order, we need to cut the circle temporarly before cloning
    let tempOrder = first.order
    first.order = null

    let clone = ObjectHelper.clone(first, ResourcePlanningUi)

    // put back the orders
    first.order = tempOrder
    clone.order = tempOrder

    clone.start = _.minBy(planningUis.filter(plan => plan.start && plan.start > 0), 'start').start
    clone.end = _.maxBy(planningUis.filter(plan => plan.end && plan.end > 0), 'end').end

    return clone
  }


  groupPlannings(planningUis: ResourcePlanningUi[]): ResourcePlanningUi[] {

    if (ArrayHelper.IsEmpty(planningUis))
      return []

    planningUis = _.sortBy(planningUis, ['order.id', 'resource.id', 'start'])

    let grouped = _.groupBy(planningUis, plan => `${plan.order.id} ${plan.resource.id}`)

    let result = []


    for (var group of Object.values(grouped)) {

      switch (group.length) {
        case 0:
          break
        case 1:
          result.push(group[0])
          break
        default:
           let newGroup = this.groupSamePlannings(group)
          result.push(newGroup) 
          break
      }
    }

    return result


  }

  /**
 * 
 * @param start 
 * @param end 
 * @param callBackFunc the function to be called whenever there are updates to the requested data  
 * @param context will be passed again as the first parameter to the callBackFunc (this.* is replaced by context.* inside the callBackFunc) 
 * @returns 
 */
  async getPlanningUisBetween(start: Date, end: Date, callBackFunc: (context: any, planningUis: ResourcePlanningUi[]) => void, context): Promise<Unsubscribe> {

    const qry = await this.prepareFireStoreQuery(start, end)

    const unsubscribe = onSnapshot(qry, (querySnapshot) => {

      const orderUis = querySnapshot.docs.map(doc => {
        const obj = doc.data()
        const orderUi = plainToInstance(OrderUi, obj)
        this.attachResources(orderUi)

        return orderUi
      }
      )

      let planningUis = orderUis.flatMap(orderUi => orderUi.planning)


      let wellnessId = 'b39b2d8a-9a06-46b8-8334-4fc400cfc2c5'
      let bodyslimmingId = '4664aeee-d787-459e-9842-49ffc3cf0540'

      planningUis = this.filterPlannings(planningUis, [ResourceType.human], [wellnessId, bodyslimmingId])

      console.warn(planningUis)
      planningUis = this.groupPlannings(planningUis)

      if (callBackFunc)
        callBackFunc(context, planningUis)

    });

    return unsubscribe

  }

  /**
   * 
   * @param start 
   * @param end 
   * @param callBackFunc the function to be called whenever there are updates to the requested data  
   * @param context will be passed again as the first parameter to the callBackFunc (this.* is replaced by context.* inside the callBackFunc) 
   * @returns 
   */
  async getOrderUisBetween(start: Date, end: Date, callBackFunc: (context: any, orderUis: OrderUi[]) => void, context): Promise<Unsubscribe> {


    const qry = await this.prepareFireStoreQuery(start, end)

    const unsubscribe = onSnapshot(qry, (querySnapshot) => {

      const orderUis = querySnapshot.docs.map(doc => {
        const obj = doc.data()
        const orderUi = plainToInstance(OrderUi, obj)
        this.attachResources(orderUi)
        return orderUi
      }
      )

      if (callBackFunc)
        callBackFunc(context, orderUis)

    });

    return unsubscribe

  }

  setOrderOnPlannings() {

  }


  attachResources(orderUi: OrderUi) {

    if (!this.resources)
      console.error('Resources not available!')

    if (!orderUi || ArrayHelper.IsEmpty(orderUi.planning))
      return

    orderUi.planning.forEach(plan => {

      // set a back-link
      plan.order = orderUi

      let resourceId = plan.resource?.id

      if (!resourceId)
        return

      const resource = this.resources.find(res => res.id == resourceId)

      if (resource)
        plan.resource = resource

    })

  }




  /*
  
      const msgCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "msg");
  
      const qry = query(msgCol, or(where("from", "==", contact.mobile), where("to", "array-contains", contact.mobile)), orderBy('cre', 'desc'), limit(10))
  
      const querySnapshot = await getDocs(qry);
  
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
      });
  */

}
