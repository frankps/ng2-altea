import { Component, OnInit } from '@angular/core';
import { ContactService, OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { Contact, OrderLine } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { StringHelper } from 'ts-common';
/*

http://localhost:4350/branch/aqua/order/01e28ce2-0014-4dfe-8e81-d4f77460ee09/contact-edit

*/

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  // mode: string = 'browse-catalog'  //'demo-orders'

  contact: Contact  // (branch) contact matching user

  // protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService, protected router: Router
  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected router: Router
    , protected sessionSvc: SessionService, protected authSvc: AuthService, protected contactSvc: ContactService) {

    console.error(this.orderMgrSvc.order)

    this.mode = 'browse-catalog'
  }


  get mode(): string {
    return this.orderMgrSvc.mode
  }

  set mode(newMode: string) {
    this.orderMgrSvc.changeMode(newMode)
  }



  ngOnInit(): void {

    console.error(this.orderMgrSvc.order)

    let me = this

    if (this.orderMgrSvc.hasOrderLines())
      this.mode = 'order'
    else
      this.mode = 'browse-catalog'

    this.orderMgrSvc.orderUiStateChanges.subscribe(newMode => {

      console.error('New state:', newMode)
      if (newMode)
        this.mode = newMode


      console.log(me.orderMgrSvc.order)
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


        console.log(me.orderMgrSvc.order)

      }
    })



  }

  browseCatalog() {
    this.gotoMode('browse-catalog')
    //this.mode = 'browse-catalog'
  }

  async newDemoOrder() {

    var order = await this.orderMgrSvc.saveOrder()

    console.log(order)
    this.gotoMode('pay-online')
    //this.mode = 'pay-online'
  }

  productSelected() {
    this.gotoMode('order-line')
    //this.mode = 'order-line'
  }

  newOrderLine() {
    this.gotoMode('order')
    //this.mode = 'order'
  }

  deleteOrderLine() {

    if (this.orderMgrSvc.nrOfOrderLines() == 0)
      this.gotoMode('browse-catalog')
    else
      this.gotoMode('order')
  }

  showCatalog() {
    this.gotoMode('browse-catalog')
    //this.mode = 'browse-catalog'
  }

  orderLineSelected(line: OrderLine) {
    this.gotoMode('order-line')
    //this.mode = 'order-line'
  }

  closeOrderLine() {
    this.gotoMode('order')
    //this.mode = 'order'
  }


  selectDate() {
    this.gotoMode("select-date")
    //this.mode = "select-date"
  }

  dateSelected(date: Date) {
    this.gotoMode("select-time-slot")
    //this.mode = "select-time-slot"
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

    this.gotoMode("contact-select")
    //this.mode = 'contact-select'
  }


  async timeSlotSelected(slot) {

    // this.mode = 'contact-select'

    await this.collectUserInfo()


  }

  async gotoMode(mode: string) {

    let extras = {}

    if (mode == 'order-finished') {

      let queryParams = {}
      extras['queryParams'] = queryParams

      let order = this.orderMgrSvc.order
      let productName = order?.lines[0]?.product?.name

      StringHelper.isEmail
      if (productName)
        queryParams['prod0'] = StringHelper.toUrlSafe(productName)


    }


    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', mode], extras)
  }


  async collectUserInfo() {

    if (!this.authSvc.loggedOn()) {

      this.authSvc.redirect = ['branch', 'aqua', 'orderMode', 'continue-after-sign-in']

      //this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'sign-in'])
      this.gotoMode('sign-in')
      //this.mode = 'sign-in'
    }
    else {

      await this.loadContactForUser()

    }



  }


  async orderFinished() {

    switch (this.orderMgrSvc.uiMode) {

      /** for a new gift, we will pay */
      case OrderUiMode.newGift:

        await this.orderMgrSvc.saveOrder()  // we had the issue that order was not existing

        this.payOnline()
        break

      default:

        this.gotoNextMode()

        break

    }
  }

  payOnline() {
    //  this.mode = 'pay-online'
    //this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'pay-online'])

    this.gotoMode('pay-online')
  }

  nextMode(currentMode: string) {

    console.error('nextMode() triggered, current mode:', currentMode)

    const modes = ['browse-catalog', 'order-line', 'order', 'person-select', 'staff-select', 'select-date', 'select-time-slot', 'contact-select', 'pos-summary', 'pos-contact', 'pay-online']

    const currentIdx = modes.indexOf(currentMode)
    const personSelect = 3
    const staffSelect = 4
    const selectDate = 5
    const selectTimeSlot = 6

    const order = this.orderMgrSvc.order




    let nextMode = order.paid < order.incl ? 'pay-online' : 'order-finished'

    switch (currentMode) {
      case 'contact-edit':

        return nextMode
    }

    const hasServices = order.hasServices()

    const needsPersonSelect = order.needsPersonSelect()

    console.warn('needsPersonSelect', needsPersonSelect)

    if (needsPersonSelect && currentIdx < personSelect) {
      nextMode = 'person-select'
    }
    else if (currentIdx < selectDate && order.needsPlanning()) {

      const needsStaffSelect = order.needsStaffSelect()
      console.warn('needsStaffSelect', needsStaffSelect)

      if (currentIdx < staffSelect && needsStaffSelect && order.nrOfPersons == 1) {
        nextMode = 'staff-select'
      } else {
        nextMode = 'select-date'
      }
    }

    console.warn(`Current mode = ${currentMode} -> nex mode = ${nextMode} `)

    return nextMode
  }

  gotoNextMode() {

    let nextMode = this.nextMode(this.mode)
    // this.mode = nextMode

    this.gotoMode(nextMode)

    //this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', nextMode])

  }

  staffSelected(staff: string[]) {


    console.log(this.orderMgrSvc.order)

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

    await this.orderMgrSvc.saveOrder(true)

    this.gotoNextMode()
  }


  posShowContact() {

    // this.mode = 'contact-edit'

    this.gotoMode('contact-edit')

  }

}
