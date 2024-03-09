import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, BrowseCatalogComponent } from 'ng-altea-common';
import { DashboardService, NgBaseComponent } from 'ng-common';
import { Observable, take, takeUntil } from 'rxjs';

export enum PosOrderMenuItem {
  compose = 'compose',
  plan = 'plan',
  contact = 'contact',
  pay = 'pay'
}

@Component({
  selector: 'ngx-altea-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.scss'],
})
export class ManageOrderComponent extends NgBaseComponent {


  menu: PosOrderMenuItem = PosOrderMenuItem.plan

  showPersonSelect = false

  constructor(protected route: ActivatedRoute, protected orderMgrSvc: OrderMgrUiService, protected dashboardSvc: DashboardService) {
    super()

    this.route.params.subscribe(params => {
      if (params && params['id']) {

        console.error(params['id'])

        const orderId = params['id']

        if (orderId)
          this.orderMgrSvc.loadOrder(orderId)
      }
    })

    this.dashboardSvc.showSearch = true

    this.dashboardSvc.search$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(searchString => {
      this.orderMgrSvc.searchProductsOld(searchString)
    })

  }

  test() {

  }







}
