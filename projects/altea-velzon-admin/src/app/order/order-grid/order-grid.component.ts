
import { ObjectService, OrderService, SessionService } from 'ng-altea-common'
import { Component, OnInit, ViewChild } from '@angular/core';
import { Order, OrderLine, OrderState, Product, ProductType, ProductTypeIcons, Resource } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, DateHelper, SortOrder, ArrayHelper } from 'ts-common'
import { ProductService } from 'ng-altea-common'
import { DashboardService, TranslationService, NgBaseListComponent, ToastType } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";
import * as dateFns from 'date-fns'

import { Observable, take, takeUntil } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { OrderMgmtService } from 'ts-altea-logic';


export class UIOrder extends Order {

  order: Order

  resources: Resource[] = []

  pay = {
    info: '',
    color: 'green'
  }

  summary: string

  constructor() {
    super()
  }

  static fromOrder(order: Order): UIOrder {

    const uiOrder = plainToInstance(UIOrder, order)
    uiOrder.resources = order.getResources()



    if (order.paid < order.deposit) {

      const now = new Date()
      const depoByDate = order.depoByDate()

      uiOrder.pay.info = `€${order.paid}/ €${order.deposit} / €${order.incl}`

      if (depoByDate < now)
        uiOrder.pay.color = 'red'
      else
        uiOrder.pay.color = 'orange'

    } else {
      uiOrder.pay.info = `€${order.paid} / €${order.incl}`
      uiOrder.pay.color = 'green'
    }


    if (ArrayHelper.NotEmpty(order.lines)) {

      var mostExpensiveLine = _.maxBy(order.lines, 'incl')

      if (mostExpensiveLine)
        uiOrder.summary = `${mostExpensiveLine.qty} x ${mostExpensiveLine.descr}`



    }

    return uiOrder
  }

}

export enum SearchTypeSelect {
  appointmentsOn = 'appointmentsOn',
  appointmentsMadeOn = 'appointmentsMadeOn',
  nonAppointments = 'nonAppointments',
  toInvoice = 'toInvoice',
  invoiced = 'invoiced',
  gifts = "gifts",
  none = "none"

}

export class OrderSearch {
  searchFor?: string
  start?: number
  end?: number
  typeSelect?: string = "appointmentsOn"
  states?: OrderState[]
}

@Component({
  selector: 'app-order-grid',
  templateUrl: './order-grid.component.html',
  styleUrls: ['./order-grid.component.scss'],
})
export class OrderGridComponent extends NgBaseListComponent<Order> implements OnInit {

  searchTypeSelect: Translation[] = []
  orderState: Translation[] = []

  // OrderDateSelect = SearchTypeSelect

  dateRange: Date[] = []

  orderSearch = new OrderSearch()

  uiOrders: UIOrder[] = []
  orders: Order[] = []

  initialized = false


  /** if of current order in focus */
  selected?: Order

  OrderState = OrderState


  @ViewChild('deleteModal') public deleteModal?: NgbModal;


  constructor(private orderSvc: OrderService, private translationSvc: TranslationService, private modalService: NgbModal,
    dashboardSvc: DashboardService, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService,
    public dbSvc: ObjectService, protected sessionSvc: SessionService) {
    super(['name'], { searchEnabled: true, addEnabled: true, path: 'orders' }
      , orderSvc, dashboardSvc, spinner, router)


  }


  setDate(date = new Date()) {
    this.dateRange.push(date, date)
  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  async ngOnInit() {


    super._ngOnInit()





    this.setDate()

    await this.startSearch()

    await this.translationSvc.translateEnum(SearchTypeSelect, 'ui.order.search-type-select.', this.searchTypeSelect)

    await this.translationSvc.translateEnum(OrderState, 'enums.order-state.', this.orderState)
    // this.orderState.push(new Translation('all', 'Alle'))

    console.warn(this.orderState)





    console.warn(this.searchTypeSelect)

    this.initialized = true
  }


  cancelDelete(modal: any) {
    this.orderToDelete = null
    modal.close()
  }

  async confirmDelete(modal: any) {

    let order = this.orderToDelete

    const orderMgmtSvc = new OrderMgmtService(this.dbSvc)
    var res = await orderMgmtSvc.deleteOrder(order.id)

    if (res.ok) {
      this.dashboardSvc.showToastType(ToastType.saveSuccess)

      _.remove(this.uiOrders, order)

    }
    else {
      this.dashboardSvc.showToastType(ToastType.saveError)
      console.log(res)
    }

    modal.close()

  }

  orderToDelete: UIOrder

  async startDeleteOrder(order: UIOrder) {

    this.orderToDelete = order
    this.modalService.open(this.deleteModal)

    return

  }

  async dateChange(value: Date, nullAllowed: boolean = false) {

    if (!nullAllowed && !value)
      return


    const me = this

    if (!this.initialized)
      return

    if (value == me.dateRange?.[0] && value == me.dateRange?.[1])
      return

    me.dateRange = []
    me.dateRange.push(value, value)

    await this.startSearch()
  }

  toggleSelected(uiOrder: UIOrder) {

    console.log(uiOrder)

    if (uiOrder?.id == this.selected?.id)
      this.selected = null
    else
      this.selected = uiOrder
  }

  isSelected(uiOrder: UIOrder) {
    return (uiOrder?.id == this.selected?.id)
  }

  notSelected(uiOrder: UIOrder) {
    return (uiOrder?.id != this.selected?.id)
  }

  openOrder(uiOrder: UIOrder) {

    // ['/aqua/orders/manage', orderId]
    this.router.navigate(['aqua', 'orders', 'manage', uiOrder.id])
  }


  async startSearch() {

    if (this.dateRange?.length == 2) {
      var startDate = this.dateRange[0]

      this.orderSearch.start = startDate ? DateHelper.yyyyMMdd000000(startDate) : undefined

      var endDate = this.dateRange[1]
      endDate = dateFns.addDays(endDate, 1)
      this.orderSearch.end = endDate ? DateHelper.yyyyMMdd000000(endDate) : undefined
    }

    await this.advancedSearch(this.orderSearch)
  }

  async cancelProblems() {



    this.spinner.show()

    this.objects$ = null

    const query = new DbQuery()
    query.and('state', QueryOperator.equals, OrderState.cancelled)

    query.or('paid', QueryOperator.greaterThan, 0)
    query.or('contactId', QueryOperator.not, null)

    query.take = 200

    this.objects = await this.orderSvc.query$(query)

    this.uiOrders = this.objects.map(order => UIOrder.fromOrder(order))


    console.error(this.objects)

    this.spinner.hide()


  }

  async advancedSearch(orderSearch: OrderSearch = this.orderSearch) {

    console.warn('Searching...')

    console.error(this.dateRange)


    this.spinner.show()

    this.objects$ = null
    const query = new DbQuery()


    if (orderSearch.searchFor) {

      if (orderSearch.searchFor.length == 36)
        query.and('id', QueryOperator.equals, orderSearch.searchFor)
      else
        query.and('contact.name', QueryOperator.contains, orderSearch.searchFor)
    }



    if (orderSearch.typeSelect == SearchTypeSelect.appointmentsMadeOn || orderSearch.typeSelect == SearchTypeSelect.nonAppointments) {
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



    switch (orderSearch.typeSelect) {
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


    if (ArrayHelper.NotEmpty(orderSearch.states)) {
      query.and('state', QueryOperator.in, orderSearch.states)
    }


    query.take = 50
    query.include('lines.planning.resource', 'contact')
    query.orderBy('start', SortOrder.desc)

    console.log(query)


    this.objects = await this.orderSvc.query$(query)

    this.uiOrders = this.objects.map(order => UIOrder.fromOrder(order))


    console.error(this.objects)

    this.spinner.hide()


  }

  override search(searchFor?: string) {

    this.orderSearch.searchFor = searchFor

    this.advancedSearch()
    // if (!searchFor)
    //   return


  }

}
