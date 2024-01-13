import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Payment } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-pos-payment',
  templateUrl: './pos-payment.component.html',
  styleUrls: ['./pos-payment.component.scss']
})
export class PosPaymentComponent {

  amount: number

  constructor(protected mgrUiSvc: OrderMgrUiService) {

  }

  addPayment(type: string) {

    this.mgrUiSvc.addPayment(this.amount, type, 'pos')
  }

  get totalToPay(): number {

    if (!this.mgrUiSvc.order)
      return 0

    return this.mgrUiSvc.order.incl - this.mgrUiSvc.order.paid
  }

  setAmountTotal() {
    this.amount = this.totalToPay
  }

}
