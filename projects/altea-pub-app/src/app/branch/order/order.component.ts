import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService } from 'ng-altea-common';
import { OrderLine } from 'ts-altea-model';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  mode: string = 'browse-catalog'  //'demo-orders'

  constructor(protected orderMgrSvc: OrderMgrUiService) {
  }

  ngOnInit(): void {

    if (this.orderMgrSvc.hasOrderLines())
      this.mode = 'order'
    else
      this.mode = 'browse-catalog'
  }



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
    // this.mode = 'staff-select'   // person-select

    this.mode = 'person-select'
  }

  staffSelected(staff: string[]) {
    this.mode = 'select-time-slot'
  }

  personsSelected() {
    this.mode = 'select-date'
  }
}
