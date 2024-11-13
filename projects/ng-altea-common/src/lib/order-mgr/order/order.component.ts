import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, ResourceService, SessionService } from 'ng-altea-common';
import { AppMode, CreateCheckoutSession, Order, OrderLine, OrderPerson, OrderState, Resource, ResourcePreferences, ResourceType } from 'ts-altea-model';
import { TranslationService } from 'ng-common'
import { ArrayHelper, Translation } from 'ts-common'


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

  /** show the confirmation button to finalise order (introduced for POS) */
  @Input() showConfirm = false

  show = {
    posOnly: false,
    contact: false, // show detailed contact info
    deposit: false, // show deposit terms (pay period)
    resources: false, // resource (personnel selection)
    vat: false,
    loyalty: false,
    next: false,   // show the next button (in consumer app)
    save: false,    // show the save button 
    extra: false
  }

  orderStates: Translation[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected stripeSvc: ObjectService,
    protected resourceSvc: ResourceService, protected translationSvc: TranslationService) {

  }

  async ngOnInit(): Promise<void> {

    this.appMode = this.sessionSvc.appMode

    switch (this.appMode) {
      case AppMode.consum: // consumer app
        this.show.next = true
        break

      case AppMode.pos: // point of sale
        this.show.next = true
        // this.show.save = true
        this.show.posOnly = true
        this.show.deposit = true
        this.show.contact = true
        this.show.resources = true
        //this.show.vat = true
        this.show.loyalty = true
        break

    }

    await this.translationSvc.translateEnum(OrderState, 'enums.order-state.', this.orderStates)

  }


  toggleAttention() {
    this.fieldChanged('attn')
    this.order.attn = !this.order.attn
  }

  attentionColor() : string {

   // 

    if (this.order.attn)
      return 'btn-danger' 
    else
      return 'btn-light'
  
  }


  fieldChanged(field: string) {
    console.warn(`Field changed ${field}`)
    this.order.markAsUpdated(field)
    this.orderMgrSvc.orderDirty = true
  }

  stateChanged(newState) {

    console.warn(newState)

    this.fieldChanged('state')

  }

  /**
   * Introduced when redeeming gift in consumer app: user should not see payment info 
   * (gift payment is first using full gift amount, only at end changed into correct amount) => do not show intermediate
   * @returns 
   */
  appInProgress() {
    let order = this.order
    return this.appMode == AppMode.consum && (ArrayHelper.NotEmpty(this.orderMgrSvc.payGifts))
  }

  /** Is Point Of Sale (=> internal use of app) => more functionalities */
  isPOS() {
    return this.appMode == AppMode.pos
  }

  cancelOrder() {
    this.cancel.emit(this.order)

  }


  humanResourcesChanged() {

    this.fieldChanged('resPrefs')


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

  toggleDeposit() {
    this.fieldChanged('depo')
    //this.order.markAsUpdated('depo')
    this.order.calculateDeposit()
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

  async copyOrder() {

    await this.orderMgrSvc.copyOrder()

  }


  async confirm() {

    const autoChangeState = true
    await this.orderMgrSvc.saveOrder(autoChangeState)
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

      line.m.setDirty('persons')

      console.error(line.persons)

      if (line.persons.length > line.qty)
        line.persons.splice(0, 1)

      console.error(line.persons)
    }


    this.orderMgrSvc.orderDirty = true
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
