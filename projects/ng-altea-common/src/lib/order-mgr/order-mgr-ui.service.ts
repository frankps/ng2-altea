/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { AvailabilityDebugInfo, AvailabilityRequest, AvailabilityResponse, Contact, DateBorder, Order, OrderLine, OrderLineOption, OrderState, Payment, Product, ProductType, ProductTypeIcons, ReservationOption, Resource } from 'ts-altea-model'
import { ApiListResult, ApiStatus, DateHelper, DbQuery, QueryOperator, Translation } from 'ts-common'
import { AlteaService, ObjectService, OrderMgrService, OrderService, ProductService, SessionService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common';
import { Observable, take, takeUntil } from 'rxjs';
import { AlteaDb } from 'ts-altea-logic';
import * as dateFns from 'date-fns'



@Injectable({
  providedIn: 'root'
})
export class OrderMgrUiService {

  //allCategories?: Product[] = []

  debug = true

  products: Product[]


  // the product in focus: for existing or new order line
  product: Product


  // date range selection (used to search for availability)
  from = 0
  to = 0

  // derived from product.options
  orderLineOptions: OrderLineOption[] = []

  orderLine: OrderLine
  orderLineIsNew = false

  order: Order = new Order(true)

  resources: Resource[]
  //alteaDb: AlteaDb




  constructor(private productSvc: ProductService, private orderSvc: OrderService, private orderMgrSvc: OrderMgrService
    , protected spinner: NgxSpinnerService, public dbSvc: ObjectService, protected alteaSvc: AlteaService, protected sessionSvc: SessionService,
    public dashboardSvc: DashboardService) {

    // this.alteaDb = new AlteaDb(dbSvc)
    // this.getAllCategories()

    this.autoCreateOrder()

  }


  newOrder() {
    this.order = new Order(true)
    this.order.branchId = this.sessionSvc.branchId
  }

  hasOrderLines() {

    if (!this.order)
      return false

    return this.order.hasLines()
  }

  async autoCreateOrder() {

    // const wellnessId = "31eaebbc-af39-4411-a997-f2f286c58a9d"
    // const massageId = "51d89ac4-0ede-49ab-835f-2a3dda81bd70"
    // const manicureId = "46af990e-dc8f-461d-a48d-f39b9f782b0d"
    // const pedicureId = "678f7000-5865-4d58-9d92-9a64193b48c4"


    this.newOrder()



    //    var products = await this.loadProducts$(pedicureId)   // manicureId, massageId, pedicureId


    // for (let product of products) {
    //   let orderLine = this.newOrderLine(product)
    //   this.addOrderLine(orderLine)
    // }

  }

  // newOrderLine(product)
  loadProduct$(productId: string): Promise<any> {
    const me = this

    this.spinner.show()

    return new Promise<any>(function (resolve, reject) {


      me.productSvc.get(productId, 'options:orderBy=idx.values:orderBy=idx').subscribe(product => {
        // 
        me.prepareProduct(product)
        // this.orderLine = new OrderLine()
        resolve(product)

        me.spinner.hide()
      })



    })

  }


  async loadProducts$(...productIds: string[]): Promise<Product[]> {
    const me = this

    this.spinner.show()

    const query = new DbQuery()
    query.and('id', QueryOperator.in, productIds)

    query.include('options:orderBy=idx.values:orderBy=idx')

    let products = await me.productSvc.query$(query)

    me.spinner.hide()

    return products

  }



  async selectExistingOrderLine(line: OrderLine) {

    this.spinner.show()

    await this.loadProduct$(line.productId)
    this.orderLine = line
    this.orderLineIsNew = false

    this.spinner.hide()
  }

  loadOrder(orderId: string) {

    this.spinner.show()

    // .resources.resource
    this.orderSvc.get(orderId, "lines.planning.resource,lines.product,contact,payments").subscribe(order => {

      this.order = order

      this.orderLineOptions = null
      this.orderLine = null
      this.resources = order.getResources()
      this.spinner.hide()

      console.error(order)
    })

  }

  nrOfOrderLines(): number {

    if (!this.order)
      return 0

    return this.order.nrOfLines()
  }

  availabilityResponse: AvailabilityResponse
  options: ReservationOption[]


  async getAvailabilities() {

    console.warn(this.order)

    const request = new AvailabilityRequest(this.order)
    request.debug = true
    request.from = this.from

    const toDate = DateHelper.parse(request.from)
    request.to = DateHelper.yyyyMMdd000000(dateFns.addDays(toDate, 1))

    const response = await this.alteaSvc.availabilityService.process(request)

    this.availabilityResponse = response

    if (this.availabilityResponse?.optionSet?.options)
      this.options = this.availabilityResponse.optionSet.options

    console.error(response)

  }


  async selectTimeSlot(option: ReservationOption) {

    console.warn(option)

    this.spinner.show()

    const solutionForOption = this.availabilityResponse.solutionSet.getSolutionById(option.solutionIds[0])

    const savedOrder = await this.alteaSvc.orderMgmtService.confirmOrder(this.order, option, solutionForOption)

    if (savedOrder) {

      this.refreshOrder(savedOrder)
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    }
    else
      this.dashboardSvc.showToastType(ToastType.saveError)

    this.spinner.hide()
  }

  /** when an order is saved, we need to refresh all associated objects */
  refreshOrder(bdOrder: Order) {
    this.order = bdOrder

    if (this.orderLine?.id)
      this.orderLine = this.order.getLine(this.orderLine?.id)
  }


  async changeState() {

    try {

      const res = await this.alteaSvc.orderMgmtService.changeState(this.order, OrderState.waitDeposit)

      if (res.isOk)
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
      else
        this.dashboardSvc.showToastType(ToastType.saveError)


    } catch (ex) {

      this.dashboardSvc.showToastType(ToastType.saveError)

    }



  }


  async saveOrder() {

    this.spinner.show()

    console.warn(this.order)

    const res = await this.alteaSvc.orderMgmtService.saveOrder(this.order)

    console.error(res.object)


    if (res.isOk) {
      this.refreshOrder(res.object)
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    } else {
      this.dashboardSvc.showToastType(ToastType.saveError)
    }

    console.error(res)

    this.spinner.hide()
  }



  // async getOrderContext(order: Order) {

  //   let productIds = order.lines.map(ol => ol.productId).filter(productId => productId && productId.length > 0)

  //   let products = await this.alteaSvc.db.getProducts(productIds)

  //   console.error(products)
  // }



  selectDate() {

  }

  getPossibleDates() {
    this.orderMgrSvc.getPossibleDates(this.order)
  }

  prepareProduct(product: Product) {
    this.product = product

    this.orderLineOptions = []

    if (product.options?.length > 0) {
      this.orderLineOptions = product.options.map(prodOption => OrderLineOption.fromProductOption(prodOption))
    }

    this.orderLine = new OrderLine()

    console.error(this.orderLineOptions)
  }

  showProductsInCategory(catId: string) {

    this.productSvc.getProductsInCategory(catId).subscribe(res => {
      this.products = res
      console.error(res)
    })
  }

  searchProducts(searchFor: string) {
    const query = new DbQuery()
    query.and('name', QueryOperator.contains, searchFor)
    query.and('deleted', QueryOperator.equals, false)
    query.include('options:orderBy=idx.values:orderBy=idx')
    query.take = 20

    this.productSvc.query(query).subscribe(res => {
      this.products = res.data
      console.error(res)
    })

  }

  newOrderLine(product: Product, qty = 1): OrderLine {

    console.error(product)

    this.orderLineIsNew = true
    this.prepareProduct(product)
    this.orderLine = new OrderLine(product, qty)

    return this.orderLine
  }

  addOrderLineFromProduct(product: Product, qty = 1) {
    let orderLine = this.newOrderLine(product, qty)
    this.addOrderLine(orderLine)
  }

  addOrderLine(orderLine: OrderLine, qty = 1) {
    // orderLine.orderId = this.order.id
    this.order.addLine(orderLine)
    this.orderLineIsNew = false
  }

  deleteCurrentOrderLine() {
    if (!this.orderLine)
      return

    this.order.deleteLine(this.orderLine)
    this.orderLine = null
  }

  deletePayment(payment: Payment) {

    if (!payment)
      return

    this.order.deletePayment(payment)


  }


  addPayment(amount: number, type: string, location: string) {

    const payment = new Payment()
    payment.amount = amount
    payment.type = type
    payment.loc = location

    this.order.addPayment(payment)
  }

  setContact(contact: Contact) {

    this.order.contactId = contact.id
    this.order.m.setDirty('contactId')

    this.order.contact = contact

  }


  /** to be moved to external logic */
  createSubscriptions(orderLine: OrderLine) {

    if (!orderLine.product.isSubscription())
      throw `Can't create subscription!`

    const subscriptions = this.alteaSvc.subscriptionMgmtService.createSubscriptions(this.order, orderLine)

    console.error(subscriptions)
  }



}
