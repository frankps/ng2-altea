import { Component, Output, EventEmitter } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, SessionService } from 'ng-altea-common';
import { CreateCheckoutSession, Order, OrderLine, ResourceType } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
})
export class OrderComponent {

  @Output() orderLineSelected: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();


  @Output() continue: EventEmitter<Order> = new EventEmitter<Order>();


  ResourceTypeIcons = ResourceType

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected stripeSvc: ObjectService ) {
  }

  get order() { return this.orderMgrSvc.order }


  get resources() {
    return this.orderMgrSvc.resources
  }

  get orderLine() {
    return this.orderMgrSvc.orderLine
  }

  get orderLineOptions() {
    return this.orderMgrSvc.orderLineOptions
  }


  async next() {
    this.continue.emit(this.orderMgrSvc.order)
  }


  async nextStripe() {

    // Stripe test code: https://stripe.com/docs/testing


   // const stripPaymentUrl = await this.orderMgrSvc.initStripePayment(59) 

   // window.location.href = stripPaymentUrl;


    /*
    console.warn('next()')

    const checkout = new CreateCheckoutSession(99 * 100, 'Voorschot boeking', 'http://localhost:4300/branch/aqua/menu', 'http://localhost:4300/branch/aqua/menu')

    const apiResult = await this.stripeSvc.createCheckoutSession$(checkout)
    
    console.error(apiResult.object.url)

    const stripPaymentUrl = apiResult.object.url

    window.location.href = stripPaymentUrl;

    */

    // this.continue.emit(this.orderMgrSvc.order)
  }

  selectOrderLine(line: OrderLine) {

    this.orderMgrSvc.selectExistingOrderLine(line)
    this.orderLineSelected.emit(line)
  }

}
