import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService, OrderUiMode } from 'ng-altea-common';
import { Contact, OrderLine } from 'ts-altea-model';
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

      console.error('New state:', newMode)
      if (newMode)
        this.mode = newMode
    })
  }

  browseCatalog() {
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

    switch (this.orderMgrSvc.uiMode) {

      /** for a new gift, we will pay */
      case OrderUiMode.newGift:
        this.mode = 'pay-online'
        break

      default:

        this.mode = this.nextMode(this.mode)
        /* 
                const order = this.orderMgrSvc.order
        
                if (order.needsPersonSelect()) {
                  this.mode = 'person-select'
                  return
                }
                else if (order.needsPlanning()) {
                  if (order.nrOfPersons == 1) {
                    this.mode = 'staff-select'
                    return
                  } else {
                    this.mode = 'select-date'
                    return
                  }
                } else {
                  this.mode = 'pay-online'
                  break
        
                } */
        break

    }
  }

  nextMode(currentMode: string) {

    const modes = ['browse-catalog', 'order-line', 'order', 'person-select', 'staff-select', 'select-date', 'select-time-slot', 'contact-select', 'pay-online']

    const currentIdx = modes.indexOf(currentMode)
    const personSelect = 3
    const staffSelect = 4
    const selectDate = 5
    const selectTimeSlot = 6

    const order = this.orderMgrSvc.order

    let nexMode = 'pay-online'

    if (currentIdx < personSelect && order.needsPersonSelect()) {
      nexMode = 'person-select'
    }
    else if (currentIdx < selectDate && order.needsPlanning()) {
      if (currentIdx < staffSelect && order.needsStaffSelect() && order.nrOfPersons == 1) {
        nexMode = 'staff-select'
      } else {
        nexMode = 'select-date'
      }
    }

    console.warn(`Current mode = ${currentMode} -> nex mode = ${nexMode} `)

    return nexMode
  }

  staffSelected(staff: string[]) {
    this.mode = this.nextMode(this.mode)

    //this.mode = 'select-time-slot'
  }

  personsSelected() {
    this.mode = this.nextMode(this.mode)

    //this.mode = 'select-date'
  }

  selectDate() {
    this.mode = "select-date"
  }

  dateSelected(date: Date) {
    this.mode = "select-time-slot"
  }

  timeSlotSelected(slot) {

    this.mode = 'contact-select'
  }

  contactSelected(contact: Contact) {

    this.mode = this.nextMode(this.mode)
  }

}
