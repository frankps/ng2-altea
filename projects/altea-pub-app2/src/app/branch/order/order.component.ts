import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { Contact, OrderLine } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';



@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  mode: string = 'browse-catalog'  //'demo-orders'

  // protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService, protected router: Router
  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected router: Router, protected sessionSvc: SessionService) {
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

  showCatalog() {
    this.mode = 'browse-catalog'
  }

  orderLineSelected(line: OrderLine) {
    this.mode = 'order-line'
  }

  closeOrderLine() {
    this.mode = 'order'
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



  orderFinished() {

    switch (this.orderMgrSvc.uiMode) {

      /** for a new gift, we will pay */
      case OrderUiMode.newGift:
        this.payOnline()
        break

      default:

        this.gotoNextMode()

        break

    }
  }

  payOnline() {
    this.mode = 'pay-online'
    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
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

  gotoNextMode() {
    this.mode = this.nextMode(this.mode)
  }

  staffSelected(staff: string[]) {
    this.gotoNextMode()

    //this.mode = 'select-time-slot'
  }

  personsSelected() {
    this.gotoNextMode()

    //this.mode = 'select-date'
  }

  contactSelected(contact: Contact) {

    this.gotoNextMode()
  }

}
