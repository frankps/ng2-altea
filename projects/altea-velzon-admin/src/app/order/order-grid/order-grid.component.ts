
import { OrderService } from 'ng-altea-common'
import { Component, OnInit, ViewChild } from '@angular/core';
import { Order, OrderLine, Product, ProductType, ProductTypeIcons, Resource } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, DateHelper, SortOrder } from 'ts-common'
import { ProductService } from 'ng-altea-common'
import { DashboardService, TranslationService, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";

import { Observable, take, takeUntil } from 'rxjs';

export class UIOrder {
  order: Order
  resources: Resource[] = []

  constructor(order: Order) {
    if (!order)
      return

    this.order = order
    this.resources = order.getResources()

    // if (!order.lines)
    //   return

    // for (var orderLine of order.lines) {

    //   if (!orderLine.planning)
    //     continue

    //   for (var planning of orderLine.planning) {

    //     if (!planning.resource)
    //       continue

    //     if (this.resources.findIndex(r => r.id == planning.resource.id) >= 0)
    //       continue

    //     this.resources.push(planning.resource)

    //   }
    // }

    // this.resources = _.orderBy(this.resources, 'type')    //this.resources.sort()

  }
}

export enum SearchTypeSelect {
  appointmentsOn = 'appointmentsOn',
  appointmentsMadeOn = 'appointmentsMadeOn',
  nonAppointments = 'nonAppointments',
  toInvoice = 'toInvoice',
  invoiced = 'invoiced',
  gifts = "gifts"


}

export class OrderSearch {
  searchFor?: string
  start?: number
  end?: number
  typeSelect?: string = "appointmentsOn"
}

@Component({
  selector: 'app-order-grid',
  templateUrl: './order-grid.component.html',
  styleUrls: ['./order-grid.component.scss'],
})
export class OrderGridComponent extends NgBaseListComponent<Order> implements OnInit {

  searchTypeSelect: Translation[] = []

  // OrderDateSelect = SearchTypeSelect

  dateRange: Date[] = []

  orderSearch = new OrderSearch()

  uiOrders: UIOrder[] = []

  constructor(private orderSvc: OrderService, private translationSvc: TranslationService, private modalService: NgbModal,
    dashboardSvc: DashboardService, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService) {
    super(['name'], { searchEnabled: true, addEnabled: true, path: 'orders' }
      , orderSvc, dashboardSvc, spinner, router)


    var today = new Date()
    this.dateRange.push(today, today)


  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  async ngOnInit() {
    super._ngOnInit()

    this.search()

    await this.translationSvc.translateEnum(SearchTypeSelect, 'ui.order.search-type-select.', this.searchTypeSelect)

    console.warn(this.searchTypeSelect)

  }

  startSearch() {

    if (this.dateRange?.length == 2) {
      var startDate = this.dateRange[0]
      this.orderSearch.start = DateHelper.yyyyMMdd000000(startDate)

      var endDate = this.dateRange[1]
      this.orderSearch.end = DateHelper.yyyyMMdd000000(endDate) + 1000000 // we add 1 day
    }

    this.advancedSearch(this.orderSearch)
  }

  advancedSearch(orderSearch: OrderSearch = this.orderSearch) {

    console.warn('Searching...')

    console.error(this.dateRange)


    this.spinner.show()

    this.objects$ = null
    const query = new DbQuery()


    if (orderSearch.searchFor)
      query.and('contact.name', QueryOperator.contains, orderSearch.searchFor)


    if (this.orderSearch.typeSelect == SearchTypeSelect.appointmentsMadeOn || this.orderSearch.typeSelect == SearchTypeSelect.nonAppointments) {
      if (orderSearch.start)
        query.and('cre', QueryOperator.greaterThanOrEqual, DateHelper.parse(orderSearch.start))

      if (orderSearch.end)
        query.and('cre', QueryOperator.lessThan, DateHelper.parse(orderSearch.end))

    } else {
      if (orderSearch.start)
        query.and('start', QueryOperator.greaterThanOrEqual, orderSearch.start)

      if (orderSearch.end)
        query.and('start', QueryOperator.lessThan, orderSearch.end)

    }



    switch (this.orderSearch.typeSelect) {
      case SearchTypeSelect.toInvoice:
        query.and('toInvoice', QueryOperator.equals, true)
        query.and('invoiced', QueryOperator.equals, false)
        break

      case SearchTypeSelect.invoiced:
        query.and('invoiced', QueryOperator.equals, true)
        break

      case SearchTypeSelect.gifts:
        query.and('gift', QueryOperator.equals, true)
        break

      case SearchTypeSelect.nonAppointments:
        query.and('appointment', QueryOperator.equals, false)
        break
    }

    query.take = 30
    query.include('lines.planning.resource', 'contact')
    query.orderBy('start', SortOrder.asc)

    this.objects$ = this.orderSvc.query(query)

    this.objects$.subscribe(res => {

      if (res?.data) {
        this.objects = res.data

        this.uiOrders = this.objects.map(order => new UIOrder(order))

        console.warn(this.uiOrders)
      }
      else
        this.objects = []

      console.error(this.objects)

      this.spinner.hide()
    })
  }

  override search(searchFor?: string) {

    this.orderSearch.searchFor = searchFor

    this.advancedSearch()
    // if (!searchFor)
    //   return


  }

}
