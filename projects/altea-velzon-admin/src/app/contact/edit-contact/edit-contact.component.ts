
import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, OrderService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, DepositMode, LoyaltyCard, Order } from 'ts-altea-model'
import { BackendHttpServiceBase, DashboardService, FormCardSectionEventData, NgEditBaseComponent, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, ObjectWithId, CollectionChangeTracker, ApiStatus, DateHelper, DbQuery, QueryOperator, ArrayHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { scheduled } from 'rxjs';
import * as Rx from "rxjs";
import { NgForm } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import * as countryLib from 'country-list-js';
import { LoyaltyCardChangeService } from 'ng-altea-common';
import { UIOrder } from '../../order/order-grid/order-grid.component';


@Component({
  selector: 'app-edit-contact',
  templateUrl: './edit-contact.component.html',
  styleUrls: ['./edit-contact.component.scss'],
})
export class EditContactComponent extends NgEditBaseComponent<Contact> implements OnInit {
  private firestore: Firestore = inject(Firestore)

  @ViewChild('deleteModal') public deleteModal: DeleteModalComponent;

  @ViewChild('generalForm') generalForm: NgForm;

  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
  }

  Array = Array
  Math = Math

  gender: Translation[] = []
  language: Translation[] = []
  depositMode: Translation[] = []
  DepositMode = DepositMode

  countries: any[] = []
  // scheduleChanges?: CollectionChangeTracker<Schedule>

  depositPctgs = [...Array(21).keys()].map(i => { return { pct: (i * 5), label: `${i * 5} %` } })
  //depositMode: 'default' | 'custom' = "default"   // default or custom

  mobilePhoneCss = {
    row: 'row mt-3',
    colPrefix: 'col-2',
    colLocalNum: 'col-4'
  }

  orders: UIOrder[] = []
  ordersCreateBefore: Date = new Date(2050, 0, 1)

  test = "31478336034"

  public saveScheduling$: Rx.Subject<any> = new Rx.Subject<any>()

  constructor(protected contactSvc: ContactService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected scheduleSvc: ScheduleService, protected sessionSvc: SessionService, protected loyaltyCardChangeSvc: LoyaltyCardChangeService, protected orderSvc: OrderService) {
    super('contact', Contact, 'subscriptions,giftsIn,giftsOut,cards'
      , contactSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['first', 'last', 'gender', 'birth', 'email', 'emailRemind', 'mobile', 'smsRemind', 'language', 'deposit', 'depositPct'])
    this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    this.translationSvc.translateEnum(Language, 'enums.language.', this.language)
    this.translationSvc.translateEnum(DepositMode, 'enums.deposit-mode.', this.depositMode)

    this.loadCountries()
  }


  countryPrefix: any

  loadCountries() {

    this.countries = Object.values(countryLib.all)

    this.countries = this.countries.map(ctr => ({ prefix: ctr['dialing_code'], label: `${ctr['iso2']}: +${ctr['dialing_code']}` }))

    console.log("    COUNTRIES ---->", this.countries)
    /*
    var cty = country.findByIso2('BE')
    console.error(cty)

    console.error(country.all)
*/
  }

  override async objectRetrieved(contact: Contact) {

    console.error('objectRetrieved')
    console.error(contact)

    await this.getMessages(contact)

    this.orders = []
    this.ordersCreateBefore = new Date(2050, 0, 1)
    await this.getOrders()

  }


  async getMessages(contact: Contact) {


    console.error('getMessages =============', contact)

    if (!contact)
      return


    // `branches/${branchId}/msg`

    const msgCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "msg");

    const qry = query(msgCol, or(where("from", "==", contact.mobile), where("to", "array-contains", contact.mobile)), orderBy('cre', 'desc'), limit(10))

    const querySnapshot = await getDocs(qry);

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, " => ", doc.data());
    });
  }



  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/contacts/'
    this.deleteConfig.successUrlMobile = '/aqua/contacts/mobile/'
    this.deleteModal?.delete()
  }



  formChanged(sectionId: string) {

    console.log(`Form changed: ${sectionId}`)

    switch (sectionId) {

      case "general":
        this.generalForm.form.markAsDirty()
        break

    }
  }

  startEditSection(sectionId: string, sectionParam: string) {
    console.log('Start edit section', sectionId, sectionParam)

    switch (sectionId) {

      case "general":
        this.generalForm.form.markAsPristine()
        break

    }
  }
  save() {

    console.error(this.editSectionId)
    console.error(this.object)

    switch (this.editSectionId) {

      default:
        this.saveSection(this.sectionProps, this.editSectionId)
    }

  }


  depositModeChanged(custom: boolean) {

    console.warn(custom)

    if (custom) {

      this.object.depositPct = 50

    } else {

      this.object.depositPct = null

    }

    this.generalForm.form.markAsDirty()

    console.warn(this.object)

  }



  async showCardDetails(card: LoyaltyCard) {

    if (!card)
      return

    const query = new DbQuery()
    query.and('cardId', QueryOperator.equals, card.id)
    query.orderByDesc('date')

    var cardChanges = await this.loyaltyCardChangeSvc.query$(query)

    card.changes = cardChanges

    console.warn(cardChanges)

  }

  openOrder(uiOrder: UIOrder) {
    this.router.navigate(['aqua', 'orders', 'manage', uiOrder.id])
  }




  async getOrders() {


    let contact = this.object
    let take = 10

    if (!contact)
      return

    const query = new DbQuery()
    query.and('contactId', QueryOperator.equals, contact.id)
    query.and('cre', QueryOperator.lessThan, this.ordersCreateBefore)
    query.orderByDesc('cre')
    query.include('lines')
    query.take = take

    let orders = await this.orderSvc.query$(query)

    if (ArrayHelper.NotEmpty(orders)) {
      this.ordersCreateBefore = orders[orders.length - 1].cre
      this.orders.push(...orders.map(order => UIOrder.fromOrder(order)))
    } 

    if (ArrayHelper.IsEmpty(orders) || orders.length < take)
      this.ordersCreateBefore = null
    

    console.log(this.orders)

  }




}
