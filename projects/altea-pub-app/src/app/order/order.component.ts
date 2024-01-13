import { Component } from '@angular/core';
import { OrderMgrUiService } from 'ng-altea-common';
import { OrderLine } from 'ts-altea-model';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent {

  constructor(protected orderMgrSvc: OrderMgrUiService) {


  }


  mode: string = 'demo-orders'


  newDemoOrder() {
    this.mode = 'order'
  }

  productSelected() {
    this.mode = 'order-line'
  }

  newOrderLine() {
    this.mode = 'order'
  }

  deleteOrderLine() {

    if (this.orderMgrSvc.nrOfOrderLines() == 0)
      this.mode = 'browse-catalog'
    else
      this.mode = 'order'
  }

  orderLineSelected(line: OrderLine) {
    this.mode = 'order-line'
  }

  closeOrderLine() {
    this.mode = 'order'
  }

  orderFinished() {
    this.mode = 'staff-select'
  }

  staffSelected(staff: string[]) {

  }

}
