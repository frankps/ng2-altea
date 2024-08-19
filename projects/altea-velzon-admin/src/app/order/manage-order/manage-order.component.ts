import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, BrowseCatalogComponent } from 'ng-altea-common';
import { DashboardService, NgBaseComponent } from 'ng-common';
import { ContactSelect2Component } from 'projects/ng-altea-common/src/lib/order-mgr/contact-select2/contact-select2.component';
import { Observable, take, takeUntil } from 'rxjs';
import { Contact, Gift, Order, OrderLine } from 'ts-altea-model';





export enum PosOrderMenuItem {
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

    {
      code: 'new-reserv'
    },
    
    {
      code: 'buy-gift'
    }
    /*,
    {
      code: 'use-gift'
    },
    {
      code: 'demo-orders'
    }*/
  ]

  mode: PosOrderMenuItem = PosOrderMenuItem.plan

  showPersonSelect = false

  constructor(protected route: ActivatedRoute, protected orderMgrSvc: OrderMgrUiService, protected dashboardSvc: DashboardService) {
    super()

    this.route.params.subscribe(async params => {
      if (params && params['id']) {

        console.error(params['id'])

        const orderId = params['id']

        if (orderId)
          await this.orderMgrSvc.loadOrder$(orderId)
      }
    })
    
    this.dashboardSvc.showSearch = true

    this.dashboardSvc.search$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(searchString => {
      this.orderMgrSvc.searchProductsOld(searchString)
    })

  }

  async ngOnInit() {


  }

  orderLineSelected(orderLine: OrderLine) {

    this.mode = PosOrderMenuItem.compose

  }

  cancelOrder(order: Order) {

    this.mode = PosOrderMenuItem.cancel

  }

  newGift(gift: Gift) {

    console.error(gift)

  }


  menuClicked(menuItem) {

    console.error(menuItem)

    if (!menuItem)
      return


    switch (menuItem.code) {

      case 'new-reserv':

        this.orderMgrSvc.newOrder()
        this.mode = PosOrderMenuItem.compose


        break


      case 'buy-gift':
        this.mode = PosOrderMenuItem.buyGift
        
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
