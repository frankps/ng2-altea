import { Component, ViewChild, OnInit, inject, OnDestroy, Input } from '@angular/core';
import { Order, ResourcePlanning } from 'ts-altea-model';
import { and, deleteDoc, getDocs, limit, or, orderBy, query, QueryCompositeFilterConstraint, QueryFieldFilterConstraint, where } from 'firebase/firestore';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { Message, MessageAddress, MsgDirColor, MsgDirIcon, MsgStateIcon, MsgType, MsgTypeIcon, TemplateFormat, WhatsAppMessage, WhatsAppProviderInfo } from 'ts-altea-model';
import { MessagingService, SessionService } from 'ng-altea-common';
import { plainToInstance } from 'class-transformer';
import { ArrayHelper } from 'ts-common';
import * as _ from "lodash";

@Component({
  selector: 'order-mgr-order-debug-info',
  templateUrl: './order-debug-info.component.html',
  styleUrls: ['./order-debug-info.component.css']
})
export class OrderDebugInfoComponent {
  private firestore: Firestore = inject(Firestore)
  //  messages$: Observable<any[]>
  messages: Message[]

  /** selected message */
  selMessage: Message

  _order: Order

  messageSub: Subscription

  MsgType = MsgType

  MsgDirIcon = MsgDirIcon
  MsgDirColor = MsgDirColor
  MsgTypeIcon = MsgTypeIcon
  MsgStateIcon = MsgStateIcon



  planning: ResourcePlanning[] = []

  constructor(protected sessionSvc: SessionService, protected msgSvc: MessagingService,) {
  }

  @Input() set order(order: Order) {

    if (order === this._order)
      return

    this._order = order

    if (order?.id)
      this.getMessages(order.id)

    if (ArrayHelper.NotEmpty(order.planning)) {
      this.planning = _.orderBy(order.planning, 'start')
      console.warn(this.planning)
    } else {
      this.planning = []
    }

    console.warn('-------------------', order)
  }


  selectMessage(message: Message) {

    console.warn(message)

    if (message?.id == this.selMessage?.id)
      this.selMessage = null
    else
      this.selMessage = message
  }


  getMessages(orderId: string) {

    const msgCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "msg")


    const qryFilters: QueryFieldFilterConstraint[] = []

    qryFilters.push(where("orderId", "==", orderId))

    const qryFilter: QueryCompositeFilterConstraint = and(...qryFilters)

    const qry = query(msgCol, qryFilter)  //   , orderBy('cre', 'desc')    , limit(10)

    if (this.messageSub)
      this.messageSub.unsubscribe()

    this.messageSub = collectionData(qry).subscribe(dataSet => {
      let messages = dataSet.map(data => plainToInstance(Message, data))
      this.messages = _.orderBy(messages, ['sent'], ['desc'])

      console.log(this.messages)
    })



  }

}
