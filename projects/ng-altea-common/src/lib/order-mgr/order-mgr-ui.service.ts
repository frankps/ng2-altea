/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable, OnInit } from '@angular/core';
import { AppMode, AvailabilityDebugInfo, AvailabilityRequest, AvailabilityResponse, Branch, ConfirmOrderResponse, Contact, CreateCheckoutSession, DateBorder, DepositMode, Gift, GiftLine, GiftType, Order, OrderLine, OrderLineOption, OrderSource, OrderState, Payment, PaymentType, Price, Product, ProductSubType, ProductType, ProductTypeIcons, RedeemGift, ReservationOption, ReservationOptionSet, Resource, ResourcePlanning, ResourceType } from 'ts-altea-model'
import { ApiListResult, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, QueryOperator, Translation } from 'ts-common'
import { AlteaService, GiftService, ObjectService, OrderMgrService, OrderService, ProductService, ResourceService, SessionService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common';
import { BehaviorSubject, Observable, take, takeUntil } from 'rxjs';
import { AlteaDb, CancelOrder, LoyaltyUi, LoyaltyUiCard, OrderMgmtService, PaymentProcessing } from 'ts-altea-logic';
import * as dateFns from 'date-fns'
import { StripeService } from '../stripe.service';
import { er } from '@fullcalendar/core/internal-common';


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

  // derived from product.options
  orderLineOptions: OrderLineOption[] = []

  orderLine: OrderLine
  orderLineIsNew = false

  orderDirty = false
  order: Order

  /** when user is creating a new gift  */
  gift: Gift

  /** when user is paying with gifts */
  payGifts: Gift[] = []


  resources: Resource[]

  allHumanResources: Resource[]
  //alteaDb: AlteaDb

  /* used by order component to show correct UI component (rouing was not working when going to same page => we use rxjs) */
  orderUiStateChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)

  uiMode = OrderUiMode.newOrder

  /** available after calling getAvailabilities() */
  availabilityRequest: AvailabilityRequest
  availabilityResponse: AvailabilityResponse
  options: ReservationOption[]

  /** resource plannings associated with current order */
  plannings: ResourcePlanning[]


  loyalty: LoyaltyUi

  branch: Branch


  /*  
  */
  mode: string
  modeChanges: BehaviorSubject<string> = new BehaviorSubject<string>(null)


  isPos: boolean = false


  constructor(private productSvc: ProductService, private orderSvc: OrderService, private orderMgrSvc: OrderMgrService
    , protected spinner: NgxSpinnerService, public dbSvc: ObjectService, public alteaSvc: AlteaService, protected sessionSvc: SessionService,
    public dashboardSvc: DashboardService, protected stripeSvc: StripeService, protected resourceSvc: ResourceService, protected giftSvc: GiftService) {

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


  hasOptions(): boolean {

    return ArrayHelper.NotEmpty(this.options)

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
    this.options = null
    this.loyalty = null
    this.showTimer = false
    this.loyalty = null

    this.gift = null
    this.payGifts = []
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
      me.prepareProduct(undefined)
      return
    }

    let product = await me.productSvc.get$(productId, 'options:orderBy=idx.values:orderBy=idx,resources.resource,prices')

    me.prepareProduct(product)

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

    await this.linkProductsToOrder(order)

    if (order.gift) {
      this.gift = await this.giftSvc.getByOrderId$(orderId)

      if (!this.gift)
        this.dashboardSvc.showErrorToast('Could not find gift for this order!')
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


    this.payGifts

    console.warn(this.order)

    const request = new AvailabilityRequest(this.order)
    this.availabilityRequest = request
    request.debug = true
    request.from = this.from

    const toDate = DateHelper.parse(request.from)
    request.to = DateHelper.yyyyMMdd000000(dateFns.addDays(toDate, 1))

    console.log('availabilityRequest', request)


    const response = await this.alteaSvc.availabilityService.process(request)

    this.availabilityResponse = response

    if (this.availabilityResponse?.optionSet?.options)
      this.options = this.availabilityResponse.optionSet.options

    console.error(request)
    console.error(response)

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
  timeLeft = 10
  interval

  /**
   * https://www.w3schools.com/jsref/met_win_setinterval.asp
   * https://stackoverflow.com/questions/50455347/how-to-do-a-timer-in-angular-5
   */
  startTimer() {

    this.showTimer = true
    this.timeLeft = 10

    this.interval = setInterval(() => {

      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.interval)
      }
    }, 60 * 1000)

  }

  timerColor(): string {

    if (this.timeLeft >= 3)
      return 'green'
    else if (this.timeLeft >= 1)
      return 'orange'
    else
      return 'red'
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
          let giftRes = await this.giftSvc.create$(this.gift, this.dashboardSvc.resourceId)

          console.warn(giftRes)

          if (giftRes.isOk) {
            this.gift = giftRes.object
          }

        } else {
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

  prepareProduct(product: Product) {

    if (!product) {
      this.product = undefined
      this.orderLineOptions = []
      this.orderLine = new OrderLine()
      return
    }

    this.product = product

    this.setOrderLineOptions(product)


    this.orderLine = new OrderLine()

    console.error(this.orderLineOptions)
  }

  setOrderLineOptions(product: Product) {

    this.orderLineOptions = []

    if (product.hasOptions()) {

      let showPrivate = this.isPos

      this.orderLineOptions = product.options.filter(o => showPrivate || !o.pvt).map(prodOption => OrderLineOption.fromProductOption(prodOption, showPrivate))
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

    const me = this
    const rootProducts = await me.productSvc.getProductsInCategory$(null, isConsumerOnline)
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

    this.productSvc.getProductsInCategory(category.id, isConsumerOnline).pipe(take(1)).subscribe(res => {
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

  async addProductById(productId: string, qty = 1): Promise<OrderLine[]> {

    const product = await this.loadProduct$(productId)

    if (!product) {
      console.error(`Product not found: ${productId}`)
      return []
    }

    const orderLines = await this.addProduct(product, qty)

    return orderLines
    console.warn(this.order)
  }


  /** method used to add products (used in demo orders) */
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
        let orderLine = this.newOrderLine(product, item.qty, optionValues)
        await this.addOrderLine(orderLine)
        orderLines.push(orderLine)

      }

      if (ArrayHelper.NotEmpty(orderLines))
        await this.selectExistingOrderLine(orderLines[0])

      return orderLines

    } else {
      let orderLine = this.newOrderLine(product, qty, initOptionValues)
      await this.addOrderLine(orderLine)
      return [orderLine]
    }

  }


  /** method used in UI
   *  to do: if bundle (add individual products)
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

    if (ArrayHelper.NotEmpty(prices)) {

      for (let price of prices) {
        const orderLine = OrderLine.custom(price.title, price.value, 0.06)   // gift.vatPct
        me.addOrderLine(orderLine, 1, false)
      }

    }

    //this.tmp = 'aaaa'


  }



  newOrderLine(product: Product, qty = 1, initOptionValues?: Map<String, String[]>): OrderLine {

    console.error(product)

    this.orderLineIsNew = true
    this.prepareProduct(product)

    if (qty < product.minQty)
      qty = product.minQty

    this.orderLine = new OrderLine(product, qty, initOptionValues)

    return this.orderLine
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


  /*
STRIPE integration

  Usage:

    const stripPaymentUrl = await this.orderMgrSvc.initStripePayment(59) 
    window.location.href = stripPaymentUrl;

*/









}
