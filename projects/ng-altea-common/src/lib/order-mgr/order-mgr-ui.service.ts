/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { AvailabilityDebugInfo, AvailabilityRequest, AvailabilityResponse, Contact, CreateCheckoutSession, DateBorder, Gift, GiftType, Order, OrderLine, OrderLineOption, OrderState, Payment, PaymentType, Product, ProductType, ProductTypeIcons, RedeemGift, ReservationOption, ReservationOptionSet, Resource } from 'ts-altea-model'
import { ApiListResult, ApiStatus, DateHelper, DbQuery, QueryOperator, Translation } from 'ts-common'
import { AlteaService, ObjectService, OrderMgrService, OrderService, ProductService, SessionService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common';
import { BehaviorSubject, Observable, take, takeUntil } from 'rxjs';
import { AlteaDb } from 'ts-altea-logic';
import * as dateFns from 'date-fns'
import { StripeService } from '../stripe.service';


/** reflects the UI component that should be visible  */
export enum OrderUiState {
  demoOrders = 'demo-orders',
  browseCatalog = 'browse-catalog',
  requestInvoice = 'request-invoice'
}

export enum OrderUiMode {
  newOrder = 'new-order',
  newGift = 'new-gift'
}

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

  /** when user is creating a new gift  */
  gift: Gift

  resources: Resource[]
  //alteaDb: AlteaDb

  /* used by order component to show correct UI component (rouing was not working when going to same page => we use rxjs) */
  orderUiStateChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)

  uiMode = OrderUiMode.newOrder

  constructor(private productSvc: ProductService, private orderSvc: OrderService, private orderMgrSvc: OrderMgrService
    , protected spinner: NgxSpinnerService, public dbSvc: ObjectService, protected alteaSvc: AlteaService, protected sessionSvc: SessionService,
    public dashboardSvc: DashboardService, protected stripeSvc: StripeService) {

    // this.alteaDb = new AlteaDb(dbSvc)
    // this.getAllCategories()

    this.autoCreateOrder()

  }

  changeUiState(mode: OrderUiState | string) {
    this.orderUiStateChanges.next(mode)
  }

  setUiMode(uiMode: OrderUiMode) {
    this.uiMode = uiMode
  }

  newOrder(uiMode: OrderUiMode = OrderUiMode.newOrder) {
    this.order = new Order(true)
    this.order.branchId = this.sessionSvc.branchId
    this.uiMode = uiMode
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


      me.productSvc.get(productId, 'options:orderBy=idx.values:orderBy=idx,resources.resource').subscribe(product => {
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

    query.include('options:orderBy=idx.values:orderBy=idx','resources.resource')

    let products = await me.productSvc.query$(query)

    me.spinner.hide()

    return products
  }


  async redeemGift(redeemGift: RedeemGift) {

    console.error(redeemGift)

    if (!redeemGift)
      return

    const gift = redeemGift.gift

    const availableAmount = gift.availableAmount()

    this.newOrder()

    /** if specific gift: gift contains specific products/services */
    if (redeemGift.mode == GiftType.specific && gift.hasLines()) {

      const productIds = gift.lines.filter(l => l.pId).map(l => l.pId!)

      const products = await this.loadProducts$(...productIds)

      for (let line of gift.lines) {

        const product = products.find(p => p.id == line.pId.toLowerCase())

        if (product) {
          const optionValues = line.getOptionValuesAsMap()
          this.addOrderLineFromProduct(product, line.qty, optionValues)
        }
      }
    }

    this.addPayment(availableAmount, PaymentType.gift, this.sessionSvc.loc)

    console.error(this.order)


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

    // just for debugging
    this.options = ReservationOptionSet.createDummy().options
    console.error(this.options)

    return



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

    this.spinner.show()

    this.productSvc.getProductsInCategory(catId).pipe(take(1)).subscribe(res => {
      this.products = res
      console.error(res)

      this.spinner.hide()
    })
  }

  searchProducts(searchFor: string) {
    const query = new DbQuery()
    query.and('name', QueryOperator.contains, searchFor)
    query.and('deleted', QueryOperator.equals, false)
    query.include('options:orderBy=idx.values:orderBy=idx')
    query.take = 20
    
    this.spinner.show()

    this.productSvc.query(query).pipe(take(1)).subscribe(res => {
      this.products = res.data
      console.error(res)

      this.spinner.hide()
    })

  }

  newOrderLine(product: Product, qty = 1, initOptionValues?: Map<String, String[]>): OrderLine {

    console.error(product)

    this.orderLineIsNew = true
    this.prepareProduct(product)
    this.orderLine = new OrderLine(product, qty, initOptionValues)

    return this.orderLine
  }

  addOrderLineFromProduct(product: Product, qty = 1, initOptionValues?: Map<String, String[]>) {
    let orderLine = this.newOrderLine(product, qty, initOptionValues)
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


  /*
STRIPE integration

  Usage:

    const stripPaymentUrl = await this.orderMgrSvc.initStripePayment(59) 
    window.location.href = stripPaymentUrl;

*/









}
