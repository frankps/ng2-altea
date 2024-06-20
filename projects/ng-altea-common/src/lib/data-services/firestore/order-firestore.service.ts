import { Component, ViewChild, OnInit, inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Query, Unsubscribe, and, getDocs, limit, onSnapshot, or, orderBy, query, where } from 'firebase/firestore';
import { SessionService } from '../../session.service';
import { plainToInstance } from 'class-transformer';
import { OrderState, OrderType, OrderUi, Resource, ResourcePlanningUi, ResourceType } from 'ts-altea-model';
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

  filterOrderUis(orderUis: OrderUi[], removeOrderStates: OrderState[]): OrderUi[] {


    //const removeOrderStates = [ OrderState.cancelled ]

    // planningUis.filter(planUi => types.indexOf((planUi.resource as Resource)?.sta) >= 0)

    let filtered: OrderUi[]

    if (ArrayHelper.NotEmpty(removeOrderStates))
      filtered = orderUis.filter(orderUi => removeOrderStates.indexOf(orderUi.state) == -1)

    return filtered
  }

  filterPlannings(planningUis: ResourcePlanningUi[], types: ResourceType[], orResourceIds: string[], prep?: boolean): ResourcePlanningUi[] {

    if (ArrayHelper.IsEmpty(planningUis))
      return []

    if (prep != null && prep != undefined)
      planningUis = planningUis.filter(planUi => planUi.prep == prep)

    let filteredByType: ResourcePlanningUi[] = [], filteredByResourceId: ResourcePlanningUi[] = []

    if (ArrayHelper.NotEmpty(types))
      filteredByType = planningUis.filter(planUi => types.indexOf((planUi.resource as Resource)?.type) >= 0)

    if (ArrayHelper.NotEmpty(orResourceIds))
      filteredByResourceId = planningUis.filter(planUi => orResourceIds.indexOf(planUi.resource?.id) >= 0)




    let result: ResourcePlanningUi[] = _.union(filteredByType, filteredByResourceId)




    return result
  }


  clonePlanningUi(planUi: ResourcePlanningUi): ResourcePlanningUi {

    // since there is a circular reference order.plannings.order, we need to cut the circle temporarly before cloning
    let tempOrder = planUi.order
    planUi.order = null

    let clone = ObjectHelper.clone(planUi, ResourcePlanningUi)

    // put back the orders
    planUi.order = tempOrder
    clone.order = tempOrder

    return clone
  }

  /** An order can have multiple plannings for same client (if client requested multiple services)
   * In the agenda we want to see just 1 block if plannings are (we don't want to see multiple smaller blocks) 
   * 
   * Here we assume planningUis are for same order & resource and already ordered on start(date)
   * 
   * Sometimes, the plannings will not be consecutive, then we will NOT group (that's why we return array)
   * 
   */
  groupSamePlannings(planningUis: ResourcePlanningUi[]): ResourcePlanningUi[] {

    if (ArrayHelper.IsEmpty(planningUis))
      return null

    var first = planningUis[0]

    if (planningUis.length == 1)
      return [first]


    let result = []

    let prevPlanUi = null

    for (var planUi of planningUis) {

      if (!prevPlanUi || planUi.start != prevPlanUi.end) {
        prevPlanUi = this.clonePlanningUi(planUi)
        result.push(prevPlanUi)
        continue
      }

      // so we have: planUi.start == prevPlanUi.end

      prevPlanUi.end = planUi.end


    }

    return result


    /*
        let clone = this.clonePlanningUi(first)
    
        clone.start = _.minBy(planningUis.filter(plan => plan.start && plan.start > 0), 'start').start
        clone.end = _.maxBy(planningUis.filter(plan => plan.end && plan.end > 0), 'end').end
    
        return clone
        */
  }


  groupPlannings(planningUis: ResourcePlanningUi[]): ResourcePlanningUi[] {

    if (ArrayHelper.IsEmpty(planningUis))
      return []

    planningUis = _.sortBy(planningUis, ['order.id', 'resource.id', 'start'])

    let grouped = _.groupBy(planningUis, plan => `${plan.order.id} ${plan.resource.id} ${plan.prep}`)

    let result: ResourcePlanningUi[] = []


    for (var group of Object.values(grouped)) {

      switch (group.length) {
        case 0:
          break
        case 1:
          result.push(group[0])
          break
        default:
          let newGroup = this.groupSamePlannings(group)

          if (ArrayHelper.NotEmpty(newGroup))
            result.push(...newGroup)
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

      let orderUis = querySnapshot.docs.map(doc => {
        const obj = doc.data()
        const orderUi = plainToInstance(OrderUi, obj)
        this.attachResources(orderUi)

        return orderUi
      }
      )

      orderUis = this.filterOrderUis(orderUis, [OrderState.cancelled])

      let planningUis = orderUis.flatMap(orderUi => orderUi.planning)

      let wellnessId = 'b39b2d8a-9a06-46b8-8334-4fc400cfc2c5'
      let bodyslimmingId = '4664aeee-d787-459e-9842-49ffc3cf0540'
      let ucwId = 'e238c289-3e84-463a-84ca-1108d98ebaf4'
      let bodysculptorId = '9bc1e435-84de-4a02-b970-6e3d325e9715'

      planningUis = this.filterPlannings(planningUis, [ResourceType.human], [wellnessId, bodyslimmingId, ucwId, bodysculptorId])

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
