import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService, OrderUiMode } from 'ng-altea-common';
import { OrderLine } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  mode: string = 'browse-catalog'  //'demo-orders'

  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute) {
  }

  ngOnInit(): void {

    if (this.orderMgrSvc.hasOrderLines())
      this.mode = 'order'
    else
      this.mode = 'browse-catalog'

    this.orderMgrSvc.orderUiStateChanges.subscribe(newMode => {

      if (newMode)
        this.mode = newMode
    })
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

    switch (this.orderMgrSvc.uiMode) {

      /** for a new gift, we will pay */
      case OrderUiMode.newGift:
        this.mode = 'pay-online'
        break

      default:
        this.mode = 'person-select'
        break

    }

    
  }

  staffSelected(staff: string[]) {
    this.mode = 'select-time-slot'
  }

  personsSelected() {
    this.mode = 'select-date'
  }
}
