import { Component, OnInit, ViewChild, Input } from '@angular/core'
import { NgForm } from '@angular/forms'
import { TranslationService } from 'ng-common'
import { ArrayHelper, Translation } from 'ts-common'
import { CustomerCancelReasons, InternalCancelReasons, Order, OrderCancel, OrderCancelBy, OrderCancelCompensate, PaymentType } from 'ts-altea-model'
import { OrderMgrUiService } from '../order-mgr-ui.service'
import { AlteaService } from '../../altea.service'
import { th } from 'date-fns/locale'
import { CancelOrderMessage, CancelOrderChecks } from 'ts-altea-logic'
import { DashboardService, ToastType } from 'ng-common'
import * as _ from "lodash";

@Component({
  selector: 'order-mgr-cancel-order',
  templateUrl: './cancel-order.component.html',
  styleUrls: ['./cancel-order.component.css']
})
export class CancelOrderComponent {
  //by: any


  @Input() order: Order

  orderCancel: OrderCancel = new OrderCancel()
  css_cls_row = 'mt-3'
  initialized = false
  @ViewChild('cancelOrderForm')
  cancelOrderForm: NgForm
  customerCancelReasons: Translation[] = []
  internalCancelReasons: Translation[] = []

  CancelOrderMessage = CancelOrderMessage
  OrderCancelBy = OrderCancelBy
  checks: CancelOrderChecks


  cancelIsPossible = false





  constructor(protected orderMgrSvc: OrderMgrUiService, protected translationSvc: TranslationService, protected alteaSvc: AlteaService, public dashboardSvc: DashboardService) {

  }

  async ngOnInit() {

    console.warn('ngOnInit CancelOrderComponent')

    await this.doChecks()

    if (this.checks) {
      if (this.checks.message == CancelOrderMessage.possible || this.checks.message == CancelOrderMessage.noMoreFreeCancel)
        this.cancelIsPossible = true
    }
    //cancelPossible ook in UI



    await this.translationSvc.translateEnum(CustomerCancelReasons, 'enums.customer-cancel-reason.', this.customerCancelReasons)
    await this.translationSvc.translateEnum(InternalCancelReasons, 'enums.internal-cancel-reason.', this.internalCancelReasons)
    this.initialized = true

  }

  async doChecks() {
    //const order = this.orderMgrSvc.order

    if (!this.order)
      return

    this.checks = await this.alteaSvc.cancelOrder.checks(this.order)

    /** if there are subscription payments, then we return them (by default) */
    if (this.checks.hasSubsPayments)
      this.orderCancel.returnSubsPayments = true

    console.error(this.checks)

  }



/*
  calculateCompensation2(cancelBy: OrderCancelBy) {


    if (ArrayHelper.IsEmpty(this.order.payments)) {
      this.orderCancel.compensation = 0
      return
    }

    let totalActualPaid = this.order.totalPaidNotOfType(PaymentType.gift, PaymentType.subs)

    if (cancelBy == OrderCancelBy.cust && this.checks.message == CancelOrderMessage.noMoreFreeCancel) {  // then we keep the deposit amount
      this.orderCancel.compensation = totalActualPaid - this.order.deposit
    } else {
      this.orderCancel.compensation = totalActualPaid
    }

    if (this.orderCancel.compensation < 0)
      this.orderCancel.compensation = 0
  }

  */


  async confirmCancel($event) {
    console.warn("Button 'request' clicked: 'confirmCancel' method triggered!")
    console.warn(this.orderCancel, this.order)

    // return

    //  return
    const result = await this.alteaSvc.cancelOrder.cancelOrder(this.order, this.orderCancel)


    if (result.isOk)
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    else
      this.dashboardSvc.showToastType(ToastType.saveError)


  }

  bySelected(by: OrderCancelBy) {
    
    if (by != this.orderCancel.by) {
      this.orderCancel.reason = undefined
      this.orderCancel.compensate = OrderCancelCompensate.none
    }

    this.orderCancel.compensation = this.order.calculateCancelCompensation(by)

    // this.calculateCompensation2(by)
  }
}
