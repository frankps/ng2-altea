import { Component, Output, EventEmitter } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { SessionService } from 'ng-altea-common';
import { Order, OrderLine, ResourceType } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
})
export class OrderComponent {

  @Output() orderLineSelected: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();


  @Output() continue: EventEmitter<Order> = new EventEmitter<Order>();


  ResourceTypeIcons = ResourceType

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

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService) {
  }


  next() {
    this.continue.emit(this.orderMgrSvc.order)
  }

  selectOrderLine(line: OrderLine) {

    this.orderMgrSvc.selectExistingOrderLine(line)
    this.orderLineSelected.emit(line)
  }

}
