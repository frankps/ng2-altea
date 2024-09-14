import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, BrowseCatalogComponent } from 'ng-altea-common';
import { DashboardService, NgBaseComponent } from 'ng-common';
import { ContactSelect2Component } from 'projects/ng-altea-common/src/lib/order-mgr/contact-select2/contact-select2.component';
import { BehaviorSubject, Observable, take, takeUntil } from 'rxjs';
import { Contact, Gift, MenuItem, Order, OrderLine } from 'ts-altea-model';





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

  @ViewChild('editContact') public editContact: ContactSelect2Component;

  menu = [
    new MenuItem('new-reserv', 'always'),
    new MenuItem('buy-gift', 'always')

  ]

  //mode: PosOrderMode = PosOrderMode.plan

  modeChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)

  showPersonSelect = false

  constructor(protected route: ActivatedRoute, protected orderMgrSvc: OrderMgrUiService, protected dashboardSvc: DashboardService) {
    super()

    this.route.params.subscribe(async params => {
      if (params && params['id']) {

        console.error(params['id'])

        const orderId = params['id']

        if (orderId) {
          await this.orderMgrSvc.loadOrder$(orderId)

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

  get mode() : string {
    return this.orderMgrSvc.mode
  }

  set mode(newMode: string) {
    this.orderMgrSvc.changeMode(newMode)
  }

  changeMode(newMode: string) {

    this.orderMgrSvc.changeMode(newMode)

    /*
    if (newMode != this.mode) {
      this.modeChanges.next(newMode)
      this.mode = newMode
    }*/

    


  }

  orderContinue() {
    this.changeMode(PosOrderMode.plan)
  }

  orderLineSelected(orderLine: OrderLine) {

    this.changeMode(PosOrderMode.compose)

  }

  cancelOrder(order: Order) {

    this.changeMode(PosOrderMode.cancel)

  }

  newGift(gift: Gift) {

    console.error(gift)

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

        await this.orderMgrSvc.newOrder()

        // in order to trigger the BrowseCatalogComponent catalog component to show root folders
        this.changeMode('showRootFolders')


        this.changeMode(PosOrderMode.compose)


        break


      case 'buy-gift':
        this.changeMode(PosOrderMode.buyGift)

        break

      default:


    }





  }

  contactSelected(contact: Contact) {
    console.warn(contact)

    this.editContact.contact = contact

  }

  test() {

  }







}
