import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, ResourceService, SessionService } from 'ng-altea-common';
import { AppMode, CreateCheckoutSession, Order, OrderLine, OrderPerson, Resource, ResourcePreferences, ResourceType } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
})
export class OrderComponent implements OnInit {

  // @Input() order: Order

  @Output() orderLineSelected: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();

  @Output() addProduct: EventEmitter<void> = new EventEmitter<void>();
  @Output() continue: EventEmitter<Order> = new EventEmitter<Order>();

  /** used to cancel an existing order */
  @Output() cancel: EventEmitter<Order> = new EventEmitter<Order>();

  //  @Input() showVat = false

  ResourceTypeIcons = ResourceType

  depositTimes = [1, 2, 3, 4, 6, 8, 12, 24, 48, 72].map(i => { return { mins: i * 60, label: `${i} u` } })

  showHumanResources = false
  humanResources: Resource[]

  appMode: AppMode

  show = {
    posOnly: false,
    contact: false, // show detailed contact info
    deposit: false, // show deposit terms (pay period)
    resources: false, // resource (personnel selection)
    vat: false,
    loyalty: false,
    next: false,   // show the next button (in consumer app)
    save: false    // show the save button 
  }

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected stripeSvc: ObjectService, protected resourceSvc: ResourceService) {

  }

  async ngOnInit(): Promise<void> {

    this.appMode = this.sessionSvc.appMode

    switch (this.appMode) {
      case AppMode.consum: // consumer app
        this.show.next = true
        break

      case AppMode.pos: // point of sale
        this.show.next = true
        this.show.save = true
        this.show.posOnly = true
        this.show.deposit = true
        this.show.contact = true
        this.show.resources = true
        //this.show.vat = true
        //this.show.loyalty = true
        break

    }


  }

  cancelOrder() {
    this.cancel.emit(this.order)

  }


  humanResourcesChanged() {

    this.order.m.setDirty('resPrefs')
    this.orderMgrSvc.orderDirty = true

  }

  async toggleHumanResources() {

    if (!this.order.resPrefs)
      this.order.resPrefs = new ResourcePreferences()

    if (!this.humanResources)
      this.humanResources = await this.resourceSvc.getByType$(ResourceType.human)

    this.showHumanResources = !this.showHumanResources
  }


  get order() { return this.orderMgrSvc.order }


  get resources() {
    return this.orderMgrSvc.resources
  }

  get orderLine() {
    return this.orderMgrSvc.orderLine
  }

  get orderLineOptions() {
    return this.orderMgrSvc.orderLineOptions
  }

  emitAddProduct() {
    this.addProduct.emit()
  }

  async next() {
    this.continue.emit(this.orderMgrSvc.order)
  }

  async save() {

    await this.orderMgrSvc.saveOrder()
  }

  async nextStripe() {

    // Stripe test code: https://stripe.com/docs/testing


    // const stripPaymentUrl = await this.orderMgrSvc.initStripePayment(59) 

    // window.location.href = stripPaymentUrl;


    /*
    console.warn('next()')

    const checkout = new CreateCheckoutSession(99 * 100, 'Voorschot boeking', 'http://localhost:4300/branch/aqua/menu', 'http://localhost:4300/branch/aqua/menu')

    const apiResult = await this.stripeSvc.createCheckoutSession$(checkout)
    
    console.error(apiResult.object.url)

    const stripPaymentUrl = apiResult.object.url

    window.location.href = stripPaymentUrl;

    */

    // this.continue.emit(this.orderMgrSvc.order)
  }

  selectOrderLine(line: OrderLine) {

    this.orderMgrSvc.selectExistingOrderLine(line)
    this.orderLineSelected.emit(line)
  }


  incrementPersons() {
    this.order.nrOfPersons++
    this.orderMgrSvc.orderDirty = true
    this.order.updatePersons()
    /*     this.updatePersons(this.mgrUiSvc.order)
        this.refreshPersons() */
  }

  decrementPersons() {
    if (this.order.nrOfPersons > 1) {
      this.order.nrOfPersons--
      this.orderMgrSvc.orderDirty = true
      this.order.updatePersons()
      /*       this.updatePersons(this.mgrUiSvc.order)
            this.refreshPersons() */
    }
  }


  togglePerson(line: OrderLine, person: OrderPerson, personIdx: number) {

    if (!line || !person)
      return

    let idx = -1

    if (!line.persons)
      line.persons = []
    else
      idx = line.persons.indexOf(person.id)

    if (idx >= 0)
      line.persons.splice(idx)
    else {
      line.persons.push(person.id)

      console.error(line.persons)

      if (line.persons.length > line.qty)
        line.persons.splice(0, 1)

      console.error(line.persons)
    }
  }

  personCssClass(line: OrderLine, person: OrderPerson) {

    if (!line || !person || !Array.isArray(line.persons))
      return 'btn-secondary'

    let idx = line.persons.indexOf(person.id)

    if (idx >= 0)
      return 'btn-primary'
    else
      return 'btn-secondary'
  }



}
