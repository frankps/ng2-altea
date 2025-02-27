import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlteaService, OrderMgrUiService, OrderService, OrderUiMode, SessionService, SubscriptionService } from 'ng-altea-common';
import { ConnectableObservable } from 'rxjs';
import { CancelOrderChecks } from 'ts-altea-logic';
import { Contact, Order, OrderCancel, OrderCancelBy, PaymentType, Subscription } from 'ts-altea-model';
import { ArrayHelper, DateHelper, DbQuery, QueryOperator, SortOrder } from 'ts-common';
import * as dateFns from 'date-fns'


@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {


  nowNum: number

  // test
  //contactId = '44f16d0b-a5bc-4a49-9f6d-9805fae2004e'
  contact: Contact

  orders: Order[]

  /** current order */
  curOrder: Order
  cancelChecks: CancelOrderChecks

  mode: 'view' | 'cancel' = 'view'

  enableActions = false


  constructor(protected orderSvc: OrderService, protected orderMgrSvc: OrderMgrUiService, protected router: Router,
    protected sessionSvc: SessionService, protected alteaSvc: AlteaService) {

  }

  async ngOnInit() {

    this.contact = this.sessionSvc.contact

    const now = new Date()
    this.nowNum = DateHelper.yyyyMMddhhmmss(now)

    if (this.contact)
      await this.loadOrders(this.contact.id)

  }

  async checkCancel(order: Order) {

    this.mode = 'cancel'
    this.cancelChecks = undefined

    this.curOrder = await this.orderMgrSvc.loadOrder$(order.id)

    console.warn(this.curOrder)

    this.cancelChecks = await this.alteaSvc.cancelOrder.checks(this.curOrder)

    console.error(this.cancelChecks)
  }


  async confirmCancel(order: Order) {

    let orderCancel = new OrderCancel()

    orderCancel.by = OrderCancelBy.cust

    await this.alteaSvc.cancelOrder.cancelOrder(this.curOrder, orderCancel)
  }



  async moveOrder(order: Order) {

    // await this.orderMgrSvc.loadOrder$(order.id)

    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order', order.id, 'select-date'])

  }


  async loadOrders(contactId: string) {

    let now = new Date()
    let filterFrom = DateHelper.yyyyMMddhhmmss(now)
    
    const query = new DbQuery()

    query.include("lines")
    query.and("contactId", QueryOperator.equals, contactId)
    query.and("act", QueryOperator.equals, true)
    query.and("start", QueryOperator.greaterThanOrEqual, filterFrom)

    query.orderBy('start', SortOrder.desc)

    query.take = 20 

    this.orders = await this.orderSvc.query$(query)


    let order: Order

  }
}
