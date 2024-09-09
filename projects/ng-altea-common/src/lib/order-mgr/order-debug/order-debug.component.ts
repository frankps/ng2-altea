import { Component } from '@angular/core';
import { OrderMgrService, OrderService } from 'ng-altea-common';
import { AddPaymentToOrderParams } from 'ts-altea-logic';
import { Order, PaymentType } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-order-debug',
  templateUrl: './order-debug.component.html',
  styleUrls: ['./order-debug.component.css']
})
export class OrderDebugComponent {

  orderId: string = 'b47039e6-3a25-4ddd-919b-262006813eb1'
  order: Order

  amount: number = 1

  constructor(protected orderSvc: OrderService, protected orderMgrSvc: OrderMgrService) {
  }


  async getOrder(orderId: string) {

    this.order = await this.orderSvc.get$(orderId, Order.defaultInclude)

    //this.order.lines

    console.warn(this.order)

  }


  async addPayment(orderId, amount) {

    var params = new AddPaymentToOrderParams()
    params.orderId = this.orderId
    params.amount = this.amount
    params.type = PaymentType.credit

    var res = await this.orderMgrSvc.addPaymentToOrder(params)

    console.log(res)
  }



}
