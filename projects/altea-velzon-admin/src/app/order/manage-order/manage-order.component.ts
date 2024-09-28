import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, BrowseCatalogComponent } from 'ng-altea-common';
import { DashboardService, NgBaseComponent } from 'ng-common';
import { ContactSelect2Component } from 'projects/ng-altea-common/src/lib/order-mgr/contact-select2/contact-select2.component';
import { BehaviorSubject, Observable, take, takeUntil } from 'rxjs';
import { Contact, Gift, MenuItem, Order, OrderLine, OrderState } from 'ts-altea-model';





export enum PosOrderMode {
  start = 'start',
  buyGift = 'buyGift',
  compose = 'compose',
  plan = 'plan',
  contact = 'contact',
  pay = 'pay',
  cancel = 'cancel'
}



@Component({
  selector: 'ngx-altea-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.scss'],
})
export class ManageOrderComponent extends NgBaseComponent implements OnInit {

  defaultOrder = ['start', 'compose', 'plan', 'contact', 'pay']


  debug = false

  @ViewChild('editContact') public editContact: ContactSelect2Component;

  menu = [
    new MenuItem('new-reserv', 'always'),
    new MenuItem('buy-gift', 'always')

  ]

  //mode: PosOrderMode = PosOrderMode.pland

  modeChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)

  showPersonSelect = false


  showConfirm = false

  constructor(protected route: ActivatedRoute, protected orderMgrSvc: OrderMgrUiService, protected dashboardSvc: DashboardService) {
    super()

    this.route.params.subscribe(async params => {
      if (params && params['id']) {

        console.error(params['id'])

        const orderId = params['id']

        if (orderId) {
          let order = await this.orderMgrSvc.loadOrder$(orderId)

          if (order) {
            this.showConfirm = true
          }

          var isNew = this.orderMgrSvc.order.isNew()
          console.warn(isNew)

        }
      }
    })

    this.dashboardSvc.showSearch = true

    this.dashboardSvc.search$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(searchString => {
      this.orderMgrSvc.searchProductsOld(searchString)
    })

  }

  async ngOnInit() {


  }

  get mode(): string {
    return this.orderMgrSvc.mode
  }

  set mode(newMode: string) {
    this.orderMgrSvc.changeMode(newMode)
  }

  changeMode(newMode: string) {

    console.warn('new mode', newMode)


    this.orderMgrSvc.changeMode(newMode)

    /*
    if (newMode != this.mode) {
      this.modeChanges.next(newMode)
      this.mode = newMode
    }*/

  }




  orderContinue() {

    var currentMode = this.mode

    var idx = this.defaultOrder.indexOf(currentMode)

    if (idx < this.defaultOrder.length - 1) {
      var nextMode = this.defaultOrder[idx + 1]
      this.changeMode(nextMode)
    }

    this.showConfirm = this.showConfirmButton()


  }


  showConfirmButton(): boolean {

    const order = this.orderMgrSvc.order

    if (!order)
      return false

    if (order.state == OrderState.creation) {

      const hasServices = order.hasServices()

      /** if contact specified and 
       *    product only order 
       *    OR service order and start date selected) */
      if (order.contactId && (!hasServices || order.start)) {
        return true
      }
    } else {

      return true

    }

    return false

  }

  contactSelected(contact: Contact) {
    console.warn(contact)

    this.editContact.contact = contact

    this.showConfirm = this.showConfirmButton()
  }

  /*
  if (order.src == OrderSource.pos && order.state == OrderState.creation) {
           
    const hasServices = order.hasServices()

    if (order.contactId && (!hasServices || order.start)) {
        return OrderState.created
    }
}
    */


  orderLineSelected(orderLine: OrderLine) {

    this.changeMode(PosOrderMode.compose)

  }

  cancelOrder(order: Order) {

    this.changeMode(PosOrderMode.cancel)

  }

  newGift(gift: Gift) {

    console.error(gift)

    this.changeMode(PosOrderMode.compose)

  }


  timeSlotSelected(slot) {
    this.changeMode(PosOrderMode.contact)
  }


  async menuClicked(menuItem) {

    console.error(menuItem)

    if (!menuItem)
      return


    switch (menuItem.code) {

      case 'new-reserv':

        this.showConfirm = false
        await this.orderMgrSvc.newOrder()

        // in order to trigger the BrowseCatalogComponent catalog component to show root folders
        this.changeMode('showRootFolders')


        this.changeMode(PosOrderMode.compose)


        break


      case 'buy-gift':

        await this.orderMgrSvc.newOrder()

        this.changeMode(PosOrderMode.buyGift)

        break

      default:


    }





  }



  test() {

  }







}
