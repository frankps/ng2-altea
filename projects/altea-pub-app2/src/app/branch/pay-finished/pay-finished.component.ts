import { Component, OnInit } from '@angular/core';
import { ObjectService, OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { AuthService } from '../../auth/auth.service';
import { Gift, Order, OrderInvoiceInfo, StripeSessionStatus } from 'ts-altea-model';
import { NgxSpinnerService } from "ngx-spinner"
import { AlteaDb } from 'ts-altea-logic';


/**
 * Component is shown after a Stripe payment
 */

export class PayFinishedParams {
  orderId?: string
  sessionId?: string
}

@Component({
  selector: 'app-pay-finished',
  templateUrl: './pay-finished.component.html',
  styleUrls: ['./pay-finished.component.scss']
})
export class PayFinishedComponent implements OnInit {

  _db: AlteaDb

  sessionStatus: StripeSessionStatus
  allOk = false

  order: Order
  gift: Gift

  invoiceInfo: OrderInvoiceInfo
  invoiceInfoSaved = false


  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected stripeSvc: StripeService,
    protected authSvc: AuthService, protected spinner: NgxSpinnerService, protected sessionSvc: SessionService, private objSvc: ObjectService) {

    console.error('PayFinishedComponent')

  }

  get db(): AlteaDb {

    if (!this._db)
      this._db = new AlteaDb(this.objSvc, this.sessionSvc.branchId)

    return this._db
  }

  async ngOnInit() {

    let me = this

    // we want to be redirected to this page after authentication
    this.authSvc.redirectEnabled = true

    console.error('ngOnInit')
    console.error(me.orderMgrSvc.order)

    me.route.queryParams.subscribe(async (queryParams: PayFinishedParams) => {

      console.warn(queryParams)

      await this.process(queryParams)

      let order = me.orderMgrSvc.order


      if (!order.info || typeof order.info === 'string')  // initially, info used to be a string
        order.info = {}

      if (order.toInvoice)
        this.initInvoiceInfo(order)

      this.order = order

      this.gift = this.orderMgrSvc.gift
    })

  }

  initInvoiceInfo(order: Order) {

    let orderInvoiceInfo: OrderInvoiceInfo

    if (order.info['invoice']) {
      orderInvoiceInfo = order.info['invoice'] as OrderInvoiceInfo
    } else {
      orderInvoiceInfo = new OrderInvoiceInfo()
      order.info['invoice'] = orderInvoiceInfo

      if (order.contact) {

        let contact = order.contact

        if (contact.company)
          orderInvoiceInfo.company = contact.company

        if (contact.vatNum)
          orderInvoiceInfo.vatNum = contact.vatNum

        if (contact.str)
          orderInvoiceInfo.address = `${contact.str} ${contact.strNr}
${contact.postal} ${contact.city}`

        if (contact.email)
          orderInvoiceInfo.email = contact.email

        if (contact.mobile)
          orderInvoiceInfo.mobile = contact.mobile

      }

    }

    this.invoiceInfo = orderInvoiceInfo
  }

  async toggleToInvoice() {
    let me = this

    console.warn('toggleToInvoice', me.order.toInvoice)

    this.spinner.show()

    let res = await me.db.updateOrder(me.order, ['toInvoice'])

    if (me.order.toInvoice) {

      this.initInvoiceInfo(me.order)
    } else
      this.invoiceInfo = undefined

    console.warn(res)

    this.spinner.hide()
  }

  async saveInvoiceInfo() {

    this.spinner.show()

    /*
    this.order.m.setDirty('info', 'toInvoice')
    await this.orderMgrSvc.saveOrder()
*/
    let res = await this.db.updateOrder(this.order, ['info'])

    console.warn(res)

    this.invoiceInfoSaved = true

    this.spinner.hide()
  }


  // http://localhost:4300/branch/aqua/pay-finished?orderId=123&sessionId=cs_test_a19DqbHBympE97ESFCfTiKchDwrJx9YL6ah3ObRTU1Xh1CcJDZDrnICdL6%27


  async process(queryParams: PayFinishedParams) {

    console.warn(queryParams)

    if (queryParams.orderId) {
      await this.orderMgrSvc.loadOrder$(queryParams.orderId)
    }

    if (!queryParams.sessionId) {
      console.error('Stripe sessionId required!')
      return
    }

    this.spinner.show()

    const res = await this.stripeSvc.sessionStatus(this.sessionSvc.stripEnvironment, queryParams.sessionId)

    const sessionStatus = res.object

    console.error(sessionStatus)

    this.spinner.hide()

    if (sessionStatus) {

      if (sessionStatus.status == 'complete' && sessionStatus.paymentStatus == 'paid') {

        this.allOk = true
        this.orderMgrSvc.mode = 'order-finished'

        this.orderMgrSvc.stopTimer()

      }

      this.sessionStatus = sessionStatus

    }



    console.warn(this.orderMgrSvc.order)

  }



}
