/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable, OnInit } from '@angular/core';
import { AddVoucherResult, AppMode, AvailabilityDebugInfo, AvailabilityRequest, AvailabilityResponse, Branch, ConfirmOrderResponse, Contact, CreateCheckoutSession, DateBorder, DepositMode, Gift, GiftLine, GiftType, Invoice, Order, OrderLine, OrderLineOption, OrderSource, OrderState, Payment, PaymentType, Price, Product, ProductItem, ProductSubType, ProductType, ProductTypeIcons, RedeemGift, ReservationOption, ReservationOptionSet, Resource, ResourcePlanning, ResourceType } from 'ts-altea-model'
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, QueryOperator, Translation, YearMonth } from 'ts-common'
import { AlteaService, GiftService, InvoiceService, ObjectService, OrderMgrService, OrderService, ProductService, ResourceService, SessionService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common';
import { AsyncSubject, BehaviorSubject, Observable, take, takeUntil } from 'rxjs';
import { AlteaDb, CancelOrder, LoyaltyUi, LoyaltyUiCard, OrderMgmtService, PaymentProcessing } from 'ts-altea-logic';
import * as dateFns from 'date-fns'
import { StripeService } from '../stripe.service';
import { er } from '@fullcalendar/core/internal-common';
import { OrderReminders } from 'projects/ts-altea-logic/src/lib/order/messaging/order-reminders';
import { Router } from '@angular/router';



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
export class OrderMgrUiService {   // implements OnInit

  tmp = ''

  //allCategories?: Product[] = []

  debug = true

  // the current visible category (null=root)
  currentCategoryId: string = null

  // the products/categories inside the current category (currentCategoryId)
  products: Product[]

  // all the selected categories (from root to current category)
  path: Product[] = []

  // the product in focus: for existing or new order line
  product: Product

  // date range selection (used to search for availability)
  from = 0
  to = 0


  /** derived from product.options, these options containe all possible values (so UI can show them),
   * orderLine.options only contains the selected ones */
  orderLineOptions: OrderLineOption[] = []

  orderLine: OrderLine
  orderLineIsNew = false

  orderDirty = false
  order: Order

  /** when user is creating a new gift  */
  gift: Gift

  /** when user is paying with gifts */
  payGifts: Gift[] = []

  /** when user is managing an invoice */
  invoice: Invoice
  invoiceIsNew = false
  previewInvoice: boolean = false
  invoiceOk = false

  resources: Resource[]

  allHumanResources: Resource[]
  //alteaDb: AlteaDb

  /* used by order component to show correct UI component (rouing was not working when going to same page => we use rxjs) */
  orderUiStateChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)

  uiMode = OrderUiMode.newOrder

  /** available after calling getAvailabilities() */
  availabilityRequest: AvailabilityRequest
  availabilityResponse: AvailabilityResponse
  //options: ReservationOption[]

  optionSet: ReservationOptionSet

  /** resource plannings associated with current order */
  plannings: ResourcePlanning[]


  loyalty: LoyaltyUi

  branch: Branch


  /*  
  */
  mode: string
  modeChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)


  /** Is POS (Point Of Sales) => In shop  */
  isPos: boolean = false

  /**  */
  giftNotFound: boolean = false

  /** true if a user can force a time slot (even if not suggested by system) */
  canForce: boolean = false


  slugProduct: Product

  constructor(private productSvc: ProductService, private orderSvc: OrderService, private orderMgrSvc: OrderMgrService
    , protected spinner: NgxSpinnerService, public dbSvc: ObjectService, public alteaSvc: AlteaService, protected sessionSvc: SessionService,
    public dashboardSvc: DashboardService, protected stripeSvc: StripeService, protected resourceSvc: ResourceService, protected giftSvc: GiftService,
    protected invoiceSvc: InvoiceService, protected router: Router
  ) {

    // this.alteaDb = new AlteaDb(dbSvc)
    // this.getAllCategories()


    this.sessionSvc.branch$().then(branch => {
      this.branch = branch

      console.error('--- BRANCH ---', branch)
    })

    this.isPos = this.sessionSvc.isPos()

    this.autoCreateOrder()

  }


  changeMode(newMode: string) {

    if (newMode != this.mode) {
      this.modeChanges.next(newMode)
      this.mode = newMode
    }

  }


  async manageInvoice() {

    if (!this.order)
      return

    if (this.order.invoice)
      this.invoice = this.order.invoice
    else if (this.order.invoiceId) {
      let invoice = await this.invoiceSvc.get$(this.order.invoiceId, 'orders.lines')

      if (invoice) {

        if (invoice.num != this.order.invoiceNum) {
          this.order.invoiceNum = invoice.num
          this.order.markAsUpdated('invoiceNum')
          this.orderDirty = true

        }



      }

      this.invoice = invoice

    }
    else {
      this.invoice = this.order.createInvoice()
      this.invoiceIsNew = true
    }



    this.order.calculateAll()

    //this.invoice.vatLines = this.order.vatLines

    // the preview will show orders
    //this.invoice.orders = [this.order]

    this.invoice.updateFromOrders()

    this.invoiceOk = this.invoice.isConsistent()


  }


  async saveInvoice() {

    let invoice = this.invoice

    console.warn(invoice)


    let orders = invoice.orders

    delete invoice.orders

    let res

    if (this.invoiceIsNew)
      res = await this.invoiceSvc.create$(invoice)
    else
      res = await this.invoiceSvc.update$(invoice)

    invoice.orders = orders

    if (res.isOk && this.invoiceIsNew) {

      this.order.invoiceId = res.object.id
      this.order.invoiceNum = invoice.num
      this.order.markAsUpdated('invoiceId', 'invoiceNum')
      this.orderDirty = true

      await this.saveOrder()
    }

    console.warn(res)

  }


  async showInvoice() {

    this.previewInvoice = true

  }

  hasOptions(): boolean {

    return ArrayHelper.NotEmpty(this.optionSet?.options)

  }

  /* 
    async ngOnInit() {
  
    } */

  async testPaymentProcessing() {
    // normally server side

    const payProcessing = new PaymentProcessing(this.alteaSvc.db)

    const resSub = await payProcessing.doSubscriptionPayments(this.order.payments)
    console.warn(resSub)

    const resGift = await payProcessing.doGiftPayments(this.order.payments)
    console.warn(resGift)

    //return res
  }

  /*
  async cancelOrder() {

    const cancelOrderResult = await this.alteaSvc.cancelOrder.cancelOrder(this.order)

    console.error(cancelOrderResult)
  }*/

  async calculateAll() {
    this.order.calculateAll()


    //this.addPayment(100)
    await this.calculateLoyalty()


  }

  async calculateLoyalty() {

    // currently we only manage loyalty in shop (not in consumer app)
    if (!this.sessionSvc.isPos())
      return

    console.warn('-- calculateLoyalty --')

    this.loyalty = await this.alteaSvc.loyaltyMgmtService.getOverview(this.order)
    console.error(this.loyalty)

  }

  dirtyColor() {
    return this.orderDirty ? 'red' : 'green'
  }

  async loadResources() {

    /*
    const query = new DbQuery()
    query.and('code', QueryOperator.equals, this.code)

    const gifts = await this.giftSvc.query$(query)
    */

    if (!this.branch) {
      console.error(`Can't load resources: branch not specified!`)
    }

    const query = new DbQuery()
    query.and('type', QueryOperator.equals, ResourceType.human)
    query.and('branchId', QueryOperator.equals, this.branch.id)
    query.and('act', QueryOperator.equals, true)

    this.allHumanResources = await this.resourceSvc.query$(query)

  }

  getProduct(productId: string) {

    let product = this.products.find(p => p.id == productId)

    return product
  }

  changeUiState(mode: OrderUiState | string) {
    this.orderUiStateChanges.next(mode)


    switch (mode) {
      case OrderUiState.browseCatalog:
        this.currentCategoryId = null
        this.path = []
        break
    }
  }

  setUiMode(uiMode: OrderUiMode) {
    this.uiMode = uiMode
  }

  clearData() {


    this.order = null
    this.orderLineOptions = null
    this.orderLine = null
    this.orderDirty = false

    this.optionSet = null

    this.loyalty = null
    this.showTimer = false
    this.loyalty = null
    this.invoice = null
    this.invoiceIsNew = false
    this.previewInvoice = false
    this.gift = null
    this.payGifts = []

    this.showTimer = false
    this.startTimerDate = null

    this.giftNotFound = false

    this.canForce = false

    if (this.interval)
      clearInterval(this.interval)

  }

  async newOrder(uiMode: OrderUiMode = OrderUiMode.newOrder, gift?: Gift) {

    let me = this



    let branch = await this.sessionSvc.branch$()

    this.clearData()
    this.order = new Order(branch.unique, true)


    this.order.branchId = branch.id
    this.order.branch = branch

    // register source of order (pos=point of sale or consumer app)
    this.order.src = this.sessionSvc.appMode == AppMode.pos ? OrderSource.pos : OrderSource.ngApp

    this.order.lock = this.sessionSvc.clientId()

    this.uiMode = uiMode

    if (gift) {
      this.order.giftCode = gift.code
      this.order.toInvoice = gift.invoice
      this.gift = gift
    }

    if (uiMode == OrderUiMode.newGift) {
      this.order.gift = true
    }

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


    await this.newOrder()



    //    var products = await this.loadProducts$(pedicureId)   // manicureId, massageId, pedicureId


    // for (let product of products) {
    //   let orderLine = this.newOrderLine(product)
    //   this.addOrderLine(orderLine)
    // }

  }

  // newOrderLine(product)
  async loadProduct$(productId: string): Promise<any> {
    const me = this


    this.spinner.show()

    if (!productId) {
      await me.prepareProduct(undefined)
      return
    }

    let product = await me.productSvc.get$(productId, 'options:orderBy=idx.values:orderBy=idx,resources.resource,items,prices')

    await me.prepareProduct(product)

    me.spinner.hide()

    return product

  }




  async loadProducts$(...productIds: string[]): Promise<Product[]> {
    const me = this

    this.spinner.show()

    const query = new DbQuery()
    query.and('id', QueryOperator.in, productIds)

    query.include('options:orderBy=idx.values:orderBy=idx', 'resources.resource', 'items', 'prices')

    let products = await me.productSvc.query$(query)

    me.spinner.hide()

    return products
  }

  async loadProductBySlug(productSlug: string): Promise<Product> {
    const me = this

    this.spinner.show()

    const query = new DbQuery()
    query.and('slug', QueryOperator.equals, productSlug)

    query.include('options:orderBy=idx.values:orderBy=idx', 'resources.resource', 'items', 'prices')

    let product = await me.productSvc.queryFirst$(query)

    this.slugProduct = product

    me.spinner.hide()

    return product
  }



  async redeemGift(redeemGift: RedeemGift) {

    let me = this

    console.error(redeemGift)

    if (!redeemGift)
      return

    const gift = redeemGift.gift

    console.error('== redeemGift ==', this.payGifts)

    const availableAmount = gift.availableAmount()

    await this.newOrder()


    this.payGifts.push(gift)

    /** if specific gift: gift contains specific products/services */
    if (redeemGift.mode == GiftType.specific && gift.hasLines()) {

      const productIds = gift.lines.filter(l => l.pId).map(l => l.pId!)

      const products = await this.loadProducts$(...productIds)

      for (let line of gift.lines) {

        const product = products.find(p => p.id == line.pId.toLowerCase())

        if (product) {
          const optionValues = line.getOptionValuesAsMap()
          await this.addProduct(product, line.qty, optionValues)
        }
      }
    }

    const giftPay = await me.addPayment(availableAmount, PaymentType.gift, this.sessionSvc.loc)
    giftPay.giftId = gift.id
    giftPay.info = gift.code

    console.error(me.order)


  }

  moveOrderLineUp(line: OrderLine, idx: number) {

    console.warn(line)

    if (idx > 0) {

      let prevLine = this.order.lines[idx - 1]

      let lineIdx = line.idx

      this.order.lines[idx - 1] = line
      line.idx = prevLine.idx

      this.order.lines[idx] = prevLine
      prevLine.idx = lineIdx

      line.markAsUpdated('idx')
      prevLine.markAsUpdated('idx')

      //this.order.markAsUpdated('lines')

      this.orderDirty = true

    }

  }

  moveOrderLineDown(line: OrderLine, idx: number) {

    console.warn(line)

    let nrOfLines = this.order.lines.length

    if (idx < nrOfLines - 1) {

      let nextLine = this.order.lines[idx + 1]

      let lineIdx = line.idx

      this.order.lines[idx + 1] = line
      line.idx = nextLine.idx

      this.order.lines[idx] = nextLine
      nextLine.idx = lineIdx

      line.markAsUpdated('idx')
      nextLine.markAsUpdated('idx')

      //this.order.markAsUpdated('lines')

      this.orderDirty = true

    }

  }

  async selectExistingOrderLine(line: OrderLine) {

    console.warn(line)

    this.spinner.show()

    await this.loadProduct$(line.productId)

    // when we calculate special pricing, we need to hace access to order.start
    line.order = this.order
    this.orderLine = line
    this.orderLineIsNew = false

    line.order = null

    this.spinner.hide()
  }




  async linkProductsToOrder(order: Order) {

    if (!order)
      return

    let missingProductLines = order.lines.filter(l => !l.product && l.productId)
    let productIds = missingProductLines.map(l => l.productId)

    if (ArrayHelper.IsEmpty(productIds))
      return

    let products = await this.loadProducts$(...productIds)

    if (ArrayHelper.IsEmpty(products))
      return

    for (let line of missingProductLines) {
      let product = products.find(prod => prod.id == line.productId)

      if (product)
        line.product = product

    }

    await this.loadDependentProductsForOrder(order)

  }


  async loadDependentProductsForOrder(order: Order) {

    let subscriptionProductItems = order.lines.filter(l => l.product?.isSubscription()).flatMap(l => l.product.items)

    await this.loadDependentProductsForItems(subscriptionProductItems)
  }



  /**
 * Some products are composed out of other products (arrangements, bundles: see product.items).
 * This method will load these products in product.items.product 
 * @param product 
 * @returns 
 */
  async loadDependentProductsForProduct(product: Product) {

    console.log('loadDependentProducts')

    if (ArrayHelper.IsEmpty(product?.items))
      return

    await this.loadDependentProductsForItems(product?.items)

  }

  async loadDependentProductsForItems(productItems: ProductItem[]) {

    console.log('loadDependentProducts')

    if (ArrayHelper.IsEmpty(productItems))
      return

    let productItemsToLoad = productItems.filter(i => i.productId && !i.product)
    let productIdsToLoad = productItemsToLoad.map(i => i.productId)

    if (ArrayHelper.IsEmpty(productIdsToLoad))
      return

    let products = await this.loadProducts$(...productIdsToLoad)

    if (ArrayHelper.IsEmpty(products))
      return

    //console.log('before loading items.product', product)

    for (let productItem of productItemsToLoad) {
      let product = products.find(p => p.id == productItem.productId)

      if (product)
        productItem.product = product

    }

    // console.log('after loading items.product', product)

  }



  async upgradeOrder(order: Order) {

    if (!order)
      return

    const from241120 = new Date(2024, 10, 20)
    const to241123 = new Date(2024, 10, 24)

    if (order.cre >= from241120 && order.cre <= to241123) {
      let orderMgmtSvc = new OrderMgmtService(this.dbSvc)

      orderMgmtSvc.doOrderPriceChanges(order)
      order.calculateAll()
    }


  }


  async loadOrder$(orderId: string): Promise<Order> {

    this.spinner.show()

    this.clearData()

    // .resources.resource
    const order = await this.orderSvc.get$(orderId, "planning.resource,lines:orderBy=idx,contact.cards,payments:orderBy=idx")

    if (!order)
      return null

    order.branch = await this.sessionSvc.branch$()

    await this.linkProductsToOrder(order)

    if (order.gift) {
      this.gift = await this.giftSvc.getByOrderId$(orderId)

      if (!this.gift) {
        this.giftNotFound = true
        this.dashboardSvc.showErrorToast('Could not find gift for this order!')
      }

    }

    this.upgradeOrder(order)

    this.order = order

    console.error(order)


    /*     var isNew = order.isNew()
        console.warn(isNew) */

    //let depoDate = order.calculateDepositByDate()

    this.order.branch = await this.sessionSvc.branch$() // branch

    if (!this.order.branch || order.branchId != order.branch.id)
      throw new Error('Wrong branch on order!')


    this.resources = order.getResources()
    //this.setContact

    await this.calculateLoyalty()

    // this.changeMode('')

    this.spinner.hide()

    console.error(order)

    return order

  }




  nrOfOrderLines(): number {

    if (!this.order)
      return 0

    return this.order.nrOfLines()
  }



  availabilityRequestFromDate() {
    if (!this.availabilityRequest?.from)
      return null

    const from = DateHelper.parse(this.availabilityRequest.from)
    return from
  }



  async getAvailabilities() {

    // just for debugging
    /*     this.options = ReservationOptionSet.createDummy().options
        console.error(this.options)
    
        return */


    // this.payGifts

    let order = this.order


    if (order.start)  // if order was already planned, then we will work on a copy 
      order = order.clone()


    console.warn(order)

    const request = new AvailabilityRequest(order)
    this.availabilityRequest = request
    request.debug = true
    request.from = this.from

    const fromDate = DateHelper.parse(request.from)
    request.to = DateHelper.yyyyMMdd000000(dateFns.addDays(fromDate, 1))

    console.log('availabilityRequest', request)

    this.availabilityResponse = null
    this.optionSet = null

    this.availabilityResponse = await this.alteaSvc.availabilityService.process(request)


    if (this.availabilityResponse?.optionSet?.options) {
      // let reservationOptions = this.availabilityResponse.optionSet.options

      //this.options = reservationOptions

      // added later to read the inform messages
      this.optionSet = this.availabilityResponse.optionSet
    }

    if (this.sessionSvc.isPosAdmin())  // pos admin can always force
      this.canForce = true
    else {
      /** set the canForce flag: only internal users (shop) can force during default schedule (= normal operations) */
      if (this.availabilityResponse.debug.ctx) {
        let ctx = this.availabilityResponse.debug.ctx
        const branchSchedule = this.availabilityResponse.debug.ctx.getBranchScheduleOnDate(fromDate)

        if (branchSchedule?.default && this.isPos)
          this.canForce = true
        else
          this.canForce = false

        console.error(branchSchedule)
      }
    }



    console.error(request)
    // console.error(response)
  }








  setMaxWaitForDepositInHours(appMode: AppMode, bookingStart: Date): number {

    const now = new Date()

    this.order.depoMins = this.maxWaitForDepositInMinutes(appMode, bookingStart)

    const by = dateFns.addMinutes(now, this.order.depoMins)

    this.order.depoBy = DateHelper.yyyyMMddhhmmss(by)

    this.order.m.setDirty('depoMins', 'depoBy')

    return this.order.depoMins
  }


  /**
   * When consumer makes booking themselves, we require almost immediate payment
   * 
   * When bookings are created internally, we follow deposit settings
   * 
   * @param appMode 
   * @returns 
   */
  maxWaitForDepositInMinutes(appMode: AppMode, bookingStart: Date): number {

    const now = new Date()

    switch (appMode) {

      case AppMode.consum:
        return 30

      case AppMode.pos:
        // let branch = await this.sessionSvc.branch$()

        const diffDays = dateFns.differenceInDays(bookingStart, now)


        const maxWaitHours = this.branch.getMaxDepositWaitTimeInHours(diffDays) //this.setMaxWaitForDepositInMinutes(diffDays)

        console.error('diffDays!!', diffDays, maxWaitHours)

        //this.branch.getDepositTerm()

        //branch.depositTerms
        return maxWaitHours * 60

    }

    return 0
  }



  // 8552b3ae-d1fb-494c-9dd1-1425a809ab28





  async selectTimeSlot(option: ReservationOption): Promise<ApiResult<Order>> {   // ConfirmOrderResponse

    let me = this
    let confirmOrderResponse: ApiResult<Order>

    try {
      console.warn(option)

      this.spinner.show()


      if (option.order) {
        me.order = option.order
      }


      if (option.forced) {
        me.order.tags.push('forced')
      }


      // determine how much time customer has to pay deposit
      const depositMinutes = me.setMaxWaitForDepositInHours(me.sessionSvc.appMode, option.date)

      // pick-up a cancelled order
      if (me.order.state == OrderState.cancelled) {
        me.order.state = OrderState.creation
        me.order.markAsUpdated('state')
        me.orderDirty = true
      }

      me.adaptGiftPayment(me.order)

      let solutionForOption = null

      if (option.fromSolution()) {
        solutionForOption = me.availabilityResponse.solutionSet.getSolutionById(option.solutionIds[0])
        console.warn(solutionForOption)
      }


      // we might have special pricing for specific dates/times
      this.order.start = option.dateNum

      me.alteaSvc.orderMgmtService.doOrderPriceChanges(me.order)

      await this.calculateAll()


      confirmOrderResponse = await me.alteaSvc.orderMgmtService.confirmOrder(me.order, option, solutionForOption, this.availabilityResponse)

      console.warn(confirmOrderResponse)
      let order = confirmOrderResponse?.object

      if (order) {

        await me.refreshOrder(order)

        if (me.sessionSvc.appMode == AppMode.consum)
          me.startTimer()

        me.orderDirty = false
        me.dashboardSvc.showToastType(ToastType.saveSuccess)
      }
      else
        me.dashboardSvc.showToastType(ToastType.saveError)

      me.plannings = order?.planning

    } catch (err) {

      console.error(err)
    } finally {

      me.spinner.hide()

      return confirmOrderResponse

    }

  }


  /** Users  */
  showTimer = false
  startTimerDate: Date
  timeLeftSecondsInit = 10 * 60
  timeLeftSeconds = this.timeLeftSecondsInit
  interval

  // timerChanged: BehaviorSubject<number> = new BehaviorSubject<number>(this.timeLeftSeconds)

  /**
   * https://www.w3schools.com/jsref/met_win_setinterval.asp
   * https://stackoverflow.com/questions/50455347/how-to-do-a-timer-in-angular-5
   */
  startTimer() {

    this.showTimer = true

    this.startTimerDate = new Date()
    this.timeLeftSeconds = this.timeLeftSecondsInit

    this.interval = setInterval(() => {

      let now = new Date()
      let diff = dateFns.differenceInSeconds(now, this.startTimerDate)

      this.timeLeftSeconds = this.timeLeftSecondsInit - diff

      if (this.timeLeftSeconds <= 0) {
        this.stopTimer()
        this.sessionTimeout()
      }

      /*
      if (this.timeLeftSeconds > 0) {
        this.timeLeftSeconds--

       // this.timerChanged.next(timeLeftSeconds)
      } else {
        // this.timerChanged.next(0)
        //this.timerChanged.complete()
        //clearInterval(this.interval)

        this.stopTimer()
        this.sessionTimeout()
      }*/
    }, 1000)

  }

  stopTimer() {

    if (this.interval)
      clearInterval(this.interval)

  }

  async sessionTimeout() {

    this.clearData()
    await this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'menu'])
  }


  timerColor(): string {

    if (this.timeLeftSeconds >= 180)
      return 'green'
    else if (this.timeLeftSeconds >= 60)
      return 'orange'
    else
      return 'red'
  }

  timeLeftString(): string {

    const minutes = Math.floor(this.timeLeftSeconds / 60)

    /*     if (minutes >= 3)
          return `${minutes} min`
    */

    const seconds = this.timeLeftSeconds % 60

    if (minutes >= 1)
      return `${minutes} min en ${seconds} sec`

    return `${seconds} sec`
  }



  /** when an order is saved, we need to refresh all associated objects */
  async refreshOrder(bdOrder: Order) {

    // attach branch again to order (needed for deposit calculations)
    if (!bdOrder.branch) {
      bdOrder.branch = this.sessionSvc.branch
    }

    await this.linkProductsToOrder(bdOrder)

    this.order = bdOrder

    // refresh the current orderline with the saved line
    if (this.orderLine?.id)
      this.orderLine = this.order.getLine(this.orderLine?.id)
  }


  async changeState(newState: OrderState = OrderState.created) {

    try {

      const res = await this.alteaSvc.orderMgmtService.changeState(this.order, newState)

      if (res.isOk)
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
      else
        this.dashboardSvc.showToastType(ToastType.saveError)


    } catch (ex) {

      this.dashboardSvc.showToastType(ToastType.saveError)

    }



  }

  /**
   * Consumer might redeem gift, but is using less then the gift,
   * since the gift payment was already attached from the beginning, we need to adapt this gift payment
   */
  adaptGiftPayment(order: Order) {

    if (ArrayHelper.IsEmpty(order.payments))
      return

    if (order.paid > order.incl) {

      var newGiftPayment = order.payments.find(p => p.type == PaymentType.gift && p.isNew())

      if (newGiftPayment) {
        var tooMuch = order.paid - order.incl

        if (newGiftPayment.giftId == this.gift?.id)
          console.warn('We have a match')

        newGiftPayment.amount -= tooMuch
        order.paid -= tooMuch
        newGiftPayment.markAsUpdated('amount')
        order.markAsUpdated('paid')
      }
    }

  }


  async fixNonExistingGift(order: Order) {
    let gift = new Gift()

    gift.branchId = order.branchId
    gift.orderId = order.id

    gift.fromId = order.contactId

    gift.syncFromOrder(this.order)

    if (order.giftCode)
      gift.code = order.giftCode

    console.warn(gift)

    let giftRes = await this.giftSvc.create$(gift, this.dashboardSvc.resourceId)

    console.log(giftRes)

    if (giftRes.isOk) {
      this.giftNotFound = false
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    } else {
      this.dashboardSvc.showToastType(ToastType.saveError)
    }
  }

  async saveOrder(autoChangeState: boolean = false): Promise<Order> {

    let me = this

    this.spinner.show()

    console.warn(this.order)

    //const newOrder = this.order.isNew()

    // let autoChangeState = (this.sessionSvc.appMode == AppMode.pos)

    this.adaptGiftPayment(this.order)

    const res = await this.alteaSvc.orderMgmtService.saveOrder(this.order, autoChangeState)

    console.error(res.object)

    if (res.isOk) {

      let order = res.object

      await this.refreshOrder(order)
      me.orderDirty = false

      if (me.order.gift && me.gift) {

        if (this.gift?.isNew()) {

          this.gift.orderId = this.order.id
          this.gift.syncFromOrder(this.order)

          delete this.gift.payments  // this should be moved to giftSvc (or generic implementation)

          let giftRes = await this.giftSvc.create$(this.gift, this.dashboardSvc.resourceId)

          console.warn(giftRes)

          if (giftRes.isOk) {
            this.gift = giftRes.object
          }

        } else {

          delete this.gift.payments  // this should be moved to giftSvc (or generic implementation)

          this.gift.syncFromOrder(this.order)
          let giftRes = await this.giftSvc.update$(this.gift, this.dashboardSvc.resourceId)
        }
      }


      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    } else {
      this.dashboardSvc.showToastType(ToastType.saveError)
    }

    console.error(res)

    this.spinner.hide()

    return res.object
  }





  selectDate() {

  }

  getPossibleDates() {
    this.orderMgrSvc.getPossibleDates(this.order)
  }

  async prepareProduct(product: Product) {

    if (!product) {
      this.product = undefined
      this.orderLineOptions = []
      this.orderLine = new OrderLine()
      return
    }

    this.product = product

    await this.loadDependentProductsForProduct(product)

    this.setOrderLineOptions(product)

    let products = await this.loadProducts$()

    this.orderLine = new OrderLine()

    console.error(this.orderLineOptions)
  }


  setOrderLineOptions(product: Product) {

    let showPrivate = this.isPos

    console.log('setOrderLineOptions', product)

    this.orderLineOptions = []

    if (product.hasOptions()) {



      this.orderLineOptions = product.options.filter(o => showPrivate || !o.pvt).map(prodOption => OrderLineOption.fromProductOption(prodOption, showPrivate))
    }


    if (product.isSubscription() && product.hasItems()) {

      var itemOptions = product.items.flatMap(i => i.product.options)

      let extraOrderLineOptions = itemOptions.filter(o => showPrivate || !o.pvt).map(prodOption => OrderLineOption.fromProductOption(prodOption, showPrivate))

      this.orderLineOptions.push(...extraOrderLineOptions)

    }


  }

  rootCategories: Product[] = []
  rootProductCats: Product[] = []
  rootServiceCats: Product[] = []

  async showRootCategories(): Promise<Product[]> {

    this.path = []
    this.currentCategoryId = null

    if (ArrayHelper.NotEmpty(this.rootCategories)) {
      this.products = this.rootCategories
      return this.rootCategories
    }

    let isConsumerOnline = this.sessionSvc.appMode != AppMode.pos
    let branchId = this.sessionSvc.branchId

    const me = this
    const rootProducts = await me.productSvc.getProductsInCategory$(branchId, null, isConsumerOnline)
    me.products = rootProducts
    me.rootCategories = me.products

    if (rootProducts) {

      me.rootProductCats = rootProducts.filter(c => c.type == ProductType.prod)
      me.rootServiceCats = rootProducts.filter(c => c.type == ProductType.svc)

    }

    return rootProducts


  }



  /*   async showRootFolders() {
  
      console.warn('showRootFolders')
  
      const categories = await this.orderMgrSvc.showRootCategories()
  
      if (categories) {
  
        this.productCats = categories.filter(c => c.type == ProductType.product)
        this.serviceCats = categories.filter(c => c.type == ProductType.service)
  
      }
      console.debug(categories)
    }
   */



  showProductsInCategory(category: Product) {

    this.spinner.show()

    this.currentCategoryId = category.id

    if (this.path.length > 0) {
      let idx = this.path.findIndex(cat => cat.id == category.id)
      if (idx >= 0)
        this.path.splice(idx)
    }

    this.path.push(category)

    let isConsumerOnline = this.sessionSvc.appMode != AppMode.pos
    let branchId = this.sessionSvc.branchId

    this.productSvc.getProductsInCategory(branchId, category.id, isConsumerOnline).pipe(take(1)).subscribe(res => {
      this.products = res
      console.error(res)

      this.spinner.hide()
    })
  }

  async searchProductsOld(searchFor: string) {
    const query = new DbQuery()

    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    query.and('name', QueryOperator.contains, searchFor)
    query.and('del', QueryOperator.equals, false)
    query.and('showPos', QueryOperator.equals, true)

    query.include('options:orderBy=idx.values:orderBy=idx')
    query.take = 20

    this.spinner.show()

    this.products = await this.productSvc.query$(query)

    this.currentCategoryId = 'search'

    console.log(this.products)

    this.spinner.hide()


    /*     this.productSvc.query(query).pipe(take(1)).subscribe(res => {
          this.products = res.data
          console.error(res)
    
          this.spinner.hide()
        }) */

  }

  /** checks if current order contains given product */
  containsProduct(productId: string): boolean {
    if (!this.order)
      return false

    const idx = this.order.lines?.findIndex(l => l.productId == productId)

    return idx >= 0
  }

  getOrderLines(productId: string): OrderLine[] {
    if (!this.order)
      return []

    return this.order.lines.filter(l => l.productId == productId)

  }

  convertOrderLineOptionsToMap(options?: OrderLineOption[]): Map<String, String[]> {

    if (ArrayHelper.IsEmpty(options))
      return null

    let map = new Map<String, String[]>()

    for (let option of options) {

      if (!option || ArrayHelper.IsEmpty(option.values))
        continue

      let valueIds = option.values.map(v => v.id)

      map.set(option.id, valueIds)
    }


    return map

  }


  async addProductById(productId: string, qty = 1, options?: OrderLineOption[]): Promise<OrderLine[]> {

    const product = await this.loadProduct$(productId)

    if (!product) {
      console.error(`Product not found: ${productId}`)
      return []
    }

    const optionMap = this.convertOrderLineOptionsToMap(options)
    const orderLines = await this.addProduct(product, qty, optionMap)

    return orderLines
    console.warn(this.order)
  }


  async openProductBySlug(productSlug: string, params: any, qty = 1): Promise<OrderLine> {

    const product = await this.loadProductBySlug(productSlug)

    if (!product) {
      console.error(`Product not found: ${productSlug}`)
      return null
    }

    const initOptionValues = new Map<String, String[]>()

    if (params) {

      console.error(params)

      for (const optionSlug of Object.keys(params)) {

        let optionValue = params[optionSlug as keyof typeof params]

        console.log(optionSlug, params[optionSlug as keyof typeof params]);

        let productOption = product.getOptionBySlug(optionSlug)

        if (productOption) {
          let productOptionValue = productOption.getValueByValue(optionValue)

          if (productOptionValue) {
            initOptionValues.set(productOption.id, [productOptionValue.id])
          }
        }
      }
    }

    // const optionMap = this.convertOrderLineOptionsToMap(options)
    const orderLine = await this.newOrderLine(product, qty, initOptionValues)

    return orderLine

  }


  /** method used to add products (used in demo orders). When product is a bundle, then it will result in multiple orderLines */
  async addProduct(product: Product, qty = 1, initOptionValues?: Map<String, String[]>): Promise<OrderLine[]> {

    if (product.sub == ProductSubType.bundle) {

      console.error(product.items)
      if (ArrayHelper.IsEmpty(product.items))
        return []

      const orderLines = []

      for (let item of product.items) {

        /*
            query.include('options:orderBy=idx.values:orderBy=idx', 'items:orderBy=idx')
   // query.include('options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx.resource', 'items:orderBy=idx', 'prices')
   */


        const product = await this.productSvc.get$(item.productId, ['options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx', 'prices'])

        if (!product) {
          console.warn(`Product not found!`)
          continue
        }

        let optionValues = item.getOptionValuesAsMap()
        let orderLine = await this.newOrderLine(product, item.qty, optionValues)
        await this.addOrderLine(orderLine)
        orderLines.push(orderLine)

      }

      if (ArrayHelper.NotEmpty(orderLines))
        await this.selectExistingOrderLine(orderLines[0])

      return orderLines

    } else {
      let orderLine = await this.newOrderLine(product, qty, initOptionValues)
      await this.addOrderLine(orderLine)
      return [orderLine]
    }

  }


  /** method used in UI
   *  
   * 
   * @param orderLine 
   * @param qty 
   * @param setUnitPrice use false for custom products (gifts etc...)
   */
  async addOrderLine(orderLine: OrderLine, qty = 1, setUnitPrice = true, prices: Price[] = null) {
    // orderLine.orderId = this.order.id

    const me = this

    const product = orderLine?.product
    // if this is a bundle, then we need to unpack the product (and add product.items individually)

    if (product?.sub == ProductSubType.bundle) {
      const orderLines = await me.addProduct(orderLine.product, orderLine.qty)

      if (ArrayHelper.NotEmpty(orderLines)) {
        me.orderLine = orderLines[0]
      }

      return
    } else {
      console.warn(me.order)

      me.order.addLine(orderLine, setUnitPrice)

      if (product?.type == ProductType.svc) {
        /** introduced for wellness, has options adults & kids => this influences nrOfPersons */
        me.updateNrOfPersons(orderLine)
      }

      me.orderDirty = true
      me.orderLineIsNew = false

      await me.calculateLoyalty()
    }
  }

  async newOrderLine(product: Product, qty = 1, initOptionValues?: Map<String, String[]>): Promise<OrderLine> {

    let me = this

    if (qty == 0) {
      console.error('qty == 0')
    }

    console.error(product)

    me.orderLineIsNew = true
    await me.prepareProduct(product)

    if (qty > 0 && qty < product.minQty)
      qty = product.minQty

    me.orderLine = new OrderLine(product, qty, initOptionValues)

    me.preselectSpecialPrices(me.orderLine)

    return me.orderLine
  }


  preselectSpecialPrices(orderLine: OrderLine, reset: boolean = false) {

    if (reset) {
      orderLine.pc = []
    }

    let product = orderLine.product

    let hasSpecialPrices = product.hasSpecialPrices()

    if (hasSpecialPrices) {

      let prices = product.getSpecialPrices(this.isPos)

      for (let price of prices) {

        if (!this.isPos && price.posOnly)
          continue

        if (!price.auto)  // we only auto-apply prices that are marked as auto
          continue

        /** if there are price conditions, then we will not pre-select automatically */
        if (price.hasConditions())
          continue

        if (orderLine.hasPriceChange(price.id))
          continue

        orderLine.applyPrice(price)

      }


    }



  }



  updateNrOfPersons(orderLine: OrderLine = this.orderLine) {

    if (orderLine?.product?.type != ProductType.svc)
      return

    /** service 'Wellness' has options 'adults' & 'children' => these options define persons */
    let nrOfPersons = orderLine.getNrOfPersonsDefinedOnOptions()
    console.warn('nrOfPersons', nrOfPersons)

    /** to support a duo-massage for instance: 2 persons same service at same time */
    /*     if (orderLine.qty > 1) {
          nrOfPersons *= orderLine.qty
        } */


    // In order to support product 'Duo massage' that has setting customers=2
    if (orderLine.product?.customers > 1) {
      nrOfPersons *= orderLine.product?.customers
    }


    /** check if same service is added multiple times and/or orderline.qty > 1 => probably different persons */
    let productId = orderLine?.productId

    let orderLinesSameProduct = []

    if (productId) {
      orderLinesSameProduct = this.order.lines.filter(line => line.productId == productId)
      var sameProducts = orderLinesSameProduct.map(line => line.qty)
      var productQty = _.sum(sameProducts)
      nrOfPersons *= productQty
    } else {
      nrOfPersons *= orderLine.qty
    }


    if (nrOfPersons != orderLine.nrPers) {
      orderLine.nrPers = nrOfPersons
      orderLine.markAsUpdated('nrPers')
      this.orderDirty = true
    }

    if (nrOfPersons > 0) {

      if (this.order.nrOfPersons < nrOfPersons) {
        this.order.nrOfPersons = nrOfPersons
        this.order.updatePersons()
      }

    }




    let orderLinePersons = orderLine.persons.length
    if (orderLine.persons.length != nrOfPersons) {

      if (orderLinePersons < nrOfPersons) {

        for (let idx = 0; idx < this.order.persons.length; idx++) {

          const person = this.order.persons[idx]

          if (orderLine.persons.indexOf(person.id) == -1) {
            orderLine.persons.push(person.id)
            orderLinePersons++
          }

          if (orderLinePersons == nrOfPersons)
            break

        }


      } else {

        orderLine.persons.splice(nrOfPersons)

      }

    }

    orderLine.persons = _.orderBy(orderLine.persons)






  }




  deleteCurrentOrderLine() {
    if (!this.orderLine)
      return

    if (this.order.deleteLine(this.orderLine))
      this.orderDirty = true

    this.orderLine = null
  }

  deletePayment(payment: Payment) {

    if (!payment)
      return

    if (this.order.deletePayment(payment))
      this.orderDirty = true
  }

  copyPaymentToClipboard(payment: Payment) {
    this.sessionSvc.clipboard.payments.push(payment)
  }

  pastePaymentsFromClipboard() {
    if (!this.sessionSvc.clipboard.hasPayments())
      return

    for (let payment of this.sessionSvc.clipboard.payments) {
      payment.markAsUpdated('orderId')
      this.order.addPayment(payment, false)
    }

    this.sessionSvc.clipboard.payments = []
  }


  async addPayment(amount: number, type: PaymentType, location: string): Promise<Payment> {

    const payment = new Payment()
    payment.amount = amount
    payment.type = type
    payment.loc = location

    this.order.addPayment(payment)
    this.orderDirty = true

    await this.calculateLoyalty()

    return payment
  }

  async setContact(contact: Contact) {

    if (contact) {
      this.order.contactId = contact.id
      this.order.for = contact.name

      if (this.gift) {
        this.gift.fromId = contact.id
        this.gift.fromName = contact.name
      }

    }
    else {
      this.order.contactId = null
      this.order.for = null
    }

    this.order.m.setDirty('contactId')
    this.order.m.setDirty('for')
    this.orderDirty = true

    this.order.contact = contact


    this.order.calculateAll()

    await this.calculateLoyalty()

  }


  async copyOrder() {

    this.spinner.show()

    let orderToCopy = this.order

    await this.newOrder()

    const products = await this.loadProducts$(...orderToCopy.productIds())


    for (let line of orderToCopy.lines) {

      const product = products.find(p => p.id == line.productId)

      if (!product)
        continue

      let optionValues = line.getOptionValueMap()
      await this.addProduct(product, line.qty, optionValues)
    }

    await this.setContact(orderToCopy.contact)

    this.spinner.hide()
  }

  /** to be moved to external logic */
  async createSubscriptions(orderLine: OrderLine) {

    if (!orderLine.product.isSubscription())
      throw `Can't create subscription!`

    const subscriptions = await this.alteaSvc.subscriptionMgmtService.createSubscriptions(this.order, orderLine, true)


    console.error(subscriptions)
  }



  calculateTax() {

    console.error('calculateTax')

    let closedUntil = new YearMonth(2024, 9)
    this.order.calculateTax(closedUntil)

  }



  /*
STRIPE integration

  Usage:

    const stripPaymentUrl = await this.orderMgrSvc.initStripePayment(59) 
    window.location.href = stripPaymentUrl;

*/

  removeVoucher(voucher: string): boolean {
    let removed = this.order.removeVoucher(voucher)

    if (removed)
      this.orderDirty = true

    return removed
  }


  addVoucher(voucher: string): AddVoucherResult {

    if (!voucher)
      return new AddVoucherResult(voucher, false, 'Ongeldige voucher')

    if (this.order.hasVoucher(voucher)) {
      return new AddVoucherResult(voucher, false, 'Voucher al toegepast')
    }


    voucher = voucher.trim().toUpperCase()

    if (voucher == 'DEKRIJTE') {

      if (!this.order.addVoucher(voucher))
        return new AddVoucherResult(voucher, false, 'Voucher al toegepast')

      this.order.reduPct = 10
      
      this.order.calculateAll()


      this.orderDirty = true
      return new AddVoucherResult(voucher, true, `Voucher ${voucher} toegepast!`)

    }



    if (voucher == 'CAVA25' || voucher == 'KADO25') {

      if (voucher == 'CAVA25') {
        if (this.order.hasVoucher('KADO25'))
          this.order.removeVoucher('KADO25')

      }

      if (voucher == 'KADO25') {
        if (this.order.hasVoucher('CAVA25'))
          this.order.removeVoucher('CAVA25')

      }

      let startDate = this.order.startDate

      let wellnessId = '31eaebbc-af39-4411-a997-f2f286c58a9d'
      if (!this.order.hasProduct(wellnessId)) {
        return new AddVoucherResult(voucher, false, 'Gelieve eerst een wellness-boeking toe te voegen')
      }

      if (!startDate) {
        return new AddVoucherResult(voucher, false, 'Selecteer eerst een datum voor uw order!')
      }

      let sept_1_2025 = new Date(2025, 8, 1)
      if (startDate > sept_1_2025) {
        return new AddVoucherResult(voucher, false, 'Voucher enkel geldig voor boekingen tot 31 augustus 2025')
      }

      let start = '08:30'
      let end = '17:30'
      if (!DateHelper.isTimeBetween(startDate, start, end)) {
        return new AddVoucherResult(voucher, false, `Voucher enkel geldig voor boekingen tussen ${start} en ${end}`)
      }

      this.order.addVoucher(voucher)
      this.orderDirty = true
      return new AddVoucherResult(voucher, true, `Voucher ${voucher} toegepast!`)
    }

    return new AddVoucherResult(voucher, false, 'Ongeldige voucher')
  }









}
