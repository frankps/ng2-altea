import { Component, OnInit } from '@angular/core';
import { ContactService, OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { Contact, OrderLine } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';



@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  mode: string = 'browse-catalog'  //'demo-orders'

  contact: Contact  // (branch) contact matching user

  // protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService, protected router: Router
  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected router: Router
    , protected sessionSvc: SessionService, protected authSvc: AuthService, protected contactSvc: ContactService) {
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

    this.route.params.subscribe(async params => {

      if (params) {

        console.warn('params', params)

        const id = params['id']
        const mode = params['mode']

        if (id) {
          await this.orderMgrSvc.loadOrder$(id)
        }

        if (mode) {
          this.mode = mode
        
          if (mode == 'continue-after-sign-in') {

            await this.loadContactForUser()

          }
        
        }

      }
    })



  }

  browseCatalog() {
    this.mode = 'browse-catalog'
  }

  async newDemoOrder() {

    var order = await this.orderMgrSvc.saveOrder()

    console.log(order)
    this.mode = 'pay-online'
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

  /**
   * We require that a user is logged in (Google, Facebook, email,...)
   * After a user is logged in, we represent him the contact info
   */
  async loadContactForUser() {
    this.contact = await this.contactSvc.getContactForUserInBranch(this.authSvc.userId, this.sessionSvc.branchId)


    if (!this.contact) {

      // we are logged in => a valid user should exist!
      const user = this.authSvc.user
      this.contact = user.toContact(this.sessionSvc.branchId)

      // to inform component it's a new contact
      this.contact.id = null

    }

    console.warn('Current contact', this.contact)

    this.mode = 'contact-select'
  }


  async timeSlotSelected(slot) {

    // this.mode = 'contact-select'

    await this.collectUserInfo()


  }


  async collectUserInfo() {

    if (!this.authSvc.loggedOn()) {

      this.authSvc.redirect = ['branch', 'aqua', 'orderMode', 'continue-after-sign-in']

      this.mode = 'sign-in'
    }
    else {

      await this.loadContactForUser()

    }



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

    const hasServices = order.hasServices()

    const needsPersonSelect = order.needsPersonSelect()

    console.warn('needsPersonSelect', needsPersonSelect)

    if (needsPersonSelect && currentIdx < personSelect) {
      nexMode = 'person-select'
    }
    else if (currentIdx < selectDate && order.needsPlanning()) {

      const needsStaffSelect = order.needsStaffSelect()
      console.warn('needsStaffSelect', needsStaffSelect)

      if (currentIdx < staffSelect && needsStaffSelect && order.nrOfPersons == 1) {
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

  async contactSelected(contact: Contact) {

    if (!contact)   // should not happen
      return

    await this.orderMgrSvc.saveOrder()

    this.gotoNextMode()
  }

}
