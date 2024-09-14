/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable, OnInit } from '@angular/core';
import { AppMode, AvailabilityDebugInfo, AvailabilityRequest, AvailabilityResponse, Branch, ConfirmOrderResponse, Contact, CreateCheckoutSession, DateBorder, Gift, GiftType, Order, OrderLine, OrderLineOption, OrderState, Payment, PaymentType, Product, ProductSubType, ProductType, ProductTypeIcons, RedeemGift, ReservationOption, ReservationOptionSet, Resource, ResourcePlanning, ResourceType } from 'ts-altea-model'
import { ApiListResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, QueryOperator, Translation } from 'ts-common'
import { AlteaService, GiftService, ObjectService, OrderMgrService, OrderService, ProductService, ResourceService, SessionService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common';
import { BehaviorSubject, Observable, take, takeUntil } from 'rxjs';
import { AlteaDb, CancelOrder, LoyaltyUi, LoyaltyUiCard, PaymentProcessing } from 'ts-altea-logic';
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



  constructor(private productSvc: ProductService, private orderSvc: OrderService, private orderMgrSvc: OrderMgrService
    , protected spinner: NgxSpinnerService, public dbSvc: ObjectService, public alteaSvc: AlteaService, protected sessionSvc: SessionService,
    public dashboardSvc: DashboardService, protected stripeSvc: StripeService, protected resourceSvc: ResourceService, protected giftSvc: GiftService) {

    // this.alteaDb = new AlteaDb(dbSvc)
    // this.getAllCategories()


    this.sessionSvc.branch$().then(branch => {
      this.branch = branch

      console.error('--- BRANCH ---', branch)
    })

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
    this.orderLineOptions = null
    this.orderLine = null
    this.orderDirty = false
    this.options = null

  }

  async newOrder(uiMode: OrderUiMode = OrderUiMode.newOrder, gift?: Gift) {

    let me = this


    let branch = await this.sessionSvc.branch$()

    this.clearData()
    this.order = new Order(branch.unique, true)


    this.order.branchId = branch.id
    this.order.branch = branch

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
  loadProduct$(productId: string): Promise<any> {
    const me = this




    this.spinner.show()

    return new Promise<any>(function (resolve, reject) {

      if (!productId) {
        me.prepareProduct(undefined)
        resolve(undefined)
        return
      }

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

    query.include('options:orderBy=idx.values:orderBy=idx', 'resources.resource', 'items')

    let products = await me.productSvc.query$(query)

    me.spinner.hide()

    return products
  }

  /*   async searchProducts(searchFor: string): Promise<void> {
  
      const query = this.searchProductsDbQuery(searchFor)
  
  
      this.spinner.show()
  
      this.products = await this.productSvc.query$(query)
  
      this.spinner.hide()
  
  
    }
  
    searchProductsDbQuery(searchFor: string): DbQuery | null {
  
      const query = new DbQuery()
      query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
      query.and('name', QueryOperator.contains, searchFor)
      query.and('del', QueryOperator.equals, false)
  
  
  
      return query
  
    }
   */


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
          await this.addProduct(product, line.qty, optionValues)
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

  /*
  loadOrder(orderId: string) {

    this.spinner.show()

    // .resources.resourcewxs
    this.orderSvc.get(orderId, "planning.resource,lines:orderBy=idx.product,contact.cards,payments:orderBy=idx").subscribe(order => {

      this.order = order

      //let depoDate = order.calculateDepositByDate()

      this.order.branch = this.sessionSvc.branch

      if (!this.order.branch || order.branchId != order.branch.id)
        throw new Error('Wrong branch on order!')

      this.orderLineOptions = null
      this.orderLine = null
      this.resources = order.getResources()
      this.orderDirty = false

      this.spinner.hide()

      console.error(order)
    })

  }
    */





  async loadOrder$(orderId: string): Promise<Order> {

    this.spinner.show()

    this.clearData()

    // .resources.resource
    const order = await this.orderSvc.get$(orderId, "planning.resource,lines:orderBy=idx.product,contact.cards,payments:orderBy=idx")

    this.order = order

    console.error(order)


    /*     var isNew = order.isNew()
        console.warn(isNew) */

    //let depoDate = order.calculateDepositByDate()

    this.order.branch = this.sessionSvc.branch

    if (!this.order.branch || order.branchId != order.branch.id)
      throw new Error('Wrong branch on order!')


    this.resources = order.getResources()
    this.setContact



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



    console.warn(this.order)

    const request = new AvailabilityRequest(this.order)
    this.availabilityRequest = request
    request.debug = true
    request.from = this.from

    const toDate = DateHelper.parse(request.from)
    request.to = DateHelper.yyyyMMdd000000(dateFns.addDays(toDate, 1))

    const response = await this.alteaSvc.availabilityService.process(request)

    this.availabilityResponse = response

    if (this.availabilityResponse?.optionSet?.options)
      this.options = this.availabilityResponse.optionSet.options

    console.error(request)
    console.error(response)

  }

  setMaxWaitForDepositInHours(appMode: AppMode, bookingStart: Date): number {

    const now = new Date()

    this.order.depositMins = this.maxWaitForDepositInMinutes(appMode, bookingStart)

    const by = dateFns.addHours(now, this.order.depositMins)

    this.order.depositBy = DateHelper.yyyyMMddhhmmss(by)

    this.order.m.setDirty('depositMins', 'depositBy')

    return this.order.depositMins
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


  async selectTimeSlot(option: ReservationOption): Promise<ConfirmOrderResponse> {

    let me = this

    console.warn(option)

    this.spinner.show()

    const solutionForOption = me.availabilityResponse.solutionSet.getSolutionById(option.solutionIds[0])

    console.warn(solutionForOption)

    /*     this.spinner.hide()
        return */


    const depositMinutes = me.setMaxWaitForDepositInHours(me.sessionSvc.appMode, option.date)

    const confirmOrderResponse = await me.alteaSvc.orderMgmtService.confirmOrder(me.order, option, solutionForOption)

    console.warn(confirmOrderResponse)

    if (confirmOrderResponse?.order) {

      me.refreshOrder(confirmOrderResponse?.order)

      me.orderDirty = false
      me.dashboardSvc.showToastType(ToastType.saveSuccess)
    }
    else
      me.dashboardSvc.showToastType(ToastType.saveError)


    me.plannings = confirmOrderResponse.order?.planning


    me.spinner.hide()

    return confirmOrderResponse
  }

  /** when an order is saved, we need to refresh all associated objects */
  refreshOrder(bdOrder: Order) {

    // attach branch again to order (needed for deposit calculations)
    if (!bdOrder.branch) {
      bdOrder.branch = this.sessionSvc.branch
    }

    this.order = bdOrder

    if (this.orderLine?.id)
      this.orderLine = this.order.getLine(this.orderLine?.id)
  }


  async changeState() {

    try {

      const res = await this.alteaSvc.orderMgmtService.changeState(this.order, OrderState.created)

      if (res.isOk)
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
      else
        this.dashboardSvc.showToastType(ToastType.saveError)


    } catch (ex) {

      this.dashboardSvc.showToastType(ToastType.saveError)

    }



  }


  async saveOrder(): Promise<Order> {

    this.spinner.show()

    console.warn(this.order)

    const newOrder = this.order.isNew()

    const res = await this.alteaSvc.orderMgmtService.saveOrder(this.order)

    console.error(res.object)


    if (res.isOk) {
      this.refreshOrder(res.object)
      this.orderDirty = false

      if (this.order.gift) {

        if (this.gift?.isNew()) {

          this.gift.orderId = this.order.id
          let giftRes = await this.giftSvc.create$(this.gift, this.dashboardSvc.resourceId)

          console.warn(giftRes)

          if (giftRes.isOk) {
            this.gift = giftRes.object
          }

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

    this.orderLineOptions = []

    if (product.options?.length > 0) {
      this.orderLineOptions = product.options.map(prodOption => OrderLineOption.fromProductOption(prodOption))
    }

    this.orderLine = new OrderLine()

    console.error(this.orderLineOptions)
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

    const me = this
    const rootProducts = await me.productSvc.getProductsInCategory$()
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

    this.productSvc.getProductsInCategory(category.id).pipe(take(1)).subscribe(res => {
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

        const product = await this.productSvc.get$(item.productId)

        if (!product) {
          console.warn(`Product not found!`)
          continue
        }

        let orderLine = this.newOrderLine(product, item.qty, item.getOptionValuesAsMap())
        await this.addOrderLine(orderLine)
        orderLines.push(orderLine)

      }

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
  async addOrderLine(orderLine: OrderLine, qty = 1, setUnitPrice = true) {
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

      if (product.type == ProductType.svc) {
        /** introduced for wellness, has options adults & kids => this influences nrOfPersons */
        me.updateNrOfPersons(orderLine)
      }


      me.orderDirty = true
      me.orderLineIsNew = false

      await me.calculateLoyalty()
    }

    //this.tmp = 'aaaa'


  }



  newOrderLine(product: Product, qty = 1, initOptionValues?: Map<String, String[]>): OrderLine {

    console.error(product)

    this.orderLineIsNew = true
    this.prepareProduct(product)
    this.orderLine = new OrderLine(product, qty, initOptionValues)


    return this.orderLine
  }




  updateNrOfPersons(orderLine: OrderLine = this.orderLine) {

    /** service 'Wellness' has options 'adults' & 'children' => these options define persons */
    let nrOfPersons = orderLine.getNrOfPersonsDefinedOnOptions()
    console.warn('nrOfPersons', nrOfPersons)

    /** to support a duo-massage for instance: 2 persons same service at same time */
    if (orderLine.qty > 1) {
      nrOfPersons *= orderLine.qty
    }


    if (nrOfPersons > 0) {

      if (this.order.nrOfPersons < nrOfPersons) {
        this.order.nrOfPersons = nrOfPersons
        this.order.updatePersons()
      }

      /*       for (let idx = 0; idx < nrOfPersons; idx++) {
              let person = this.order.persons[idx]
              orderLine.persons.push(person.id)
            } */

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



  addPayment(amount: number, type: PaymentType, location: string): Payment {

    const payment = new Payment()
    payment.amount = amount
    payment.type = type
    payment.loc = location

    this.order.addPayment(payment)
    this.orderDirty = true

    return payment
  }

  async setContact(contact: Contact) {

    if (contact) {
      this.order.contactId = contact.id
      this.order.for = contact.name
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


  /** to be moved to external logic */
  createSubscriptions(orderLine: OrderLine) {

    if (!orderLine.product.isSubscription())
      throw `Can't create subscription!`

    const subscriptions = this.alteaSvc.subscriptionMgmtService.createSubscriptions(this.order, orderLine, true)

    console.error(subscriptions)
  }


  /*
STRIPE integration

  Usage:

    const stripPaymentUrl = await this.orderMgrSvc.initStripePayment(59) 
    window.location.href = stripPaymentUrl;

*/









}
