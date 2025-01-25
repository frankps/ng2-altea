
import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, GiftService, ObjectService, PaymentService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, Gift, Message, TemplateCode, GiftTemplateCode, Payment } from 'ts-altea-model'
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
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { AlteaDb, GiftMessaging } from 'ts-altea-logic';


@Component({
  selector: 'app-edit-gift',
  templateUrl: './edit-gift.component.html',
  styleUrls: ['./edit-gift.component.scss'],
})
export class EditGiftComponent extends NgEditBaseComponent<Gift> {


  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;

  @ViewChild('deleteModal') public deleteModal: DeleteModalComponent;

  @ViewChild('generalForm') generalForm: NgForm;

  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
    // get successUrl() { return '/aqua/resources' + }
  }

  Array = Array


  templateCodes: Translation[] = []
  initialized = false

  templateCode

  totalPayments = 0

  // gender: Translation[] = []
  // language: Translation[] = []

  // scheduleChanges?: CollectionChangeTracker<Schedule>
  // public saveScheduling$: Rx.Subject<any> = new Rx.Subject<any>()

  constructor(protected giftSvc: GiftService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService, protected backendSvc: ObjectService,
    protected sessionSvc: SessionService, protected paySvc: PaymentService) {
    super('gift', Gift, 'from,payments.order'
      , giftSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['code', 'value', 'used', 'isConsumed', 'fromName', 'fromEmail', 'toName', 'toEmail', 'toAddress', 'toMessage', 'toSendEmail', 'fromId'])
    // this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    // this.translationSvc.translateEnum(Language, 'enums.language.', this.language)

  }

  override async ngOnInit() {
    super.ngOnInit()

    await this.translationSvc.translateEnum(GiftTemplateCode, 'enums.template-code.', this.templateCodes)

    this.initialized = true


  }

  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/gifts/'
    this.deleteConfig.successUrlMobile = '/aqua/gifts/mobile/'
    this.deleteModal?.delete()
  }

  override objectRetrieved(object: Gift): void {

    console.error('objectRetrieved')
    console.error(object)

    this.totalPayments = 0

    if (ArrayHelper.NotEmpty(object.payments)) {

      let totalPayments = _.sumBy(object.payments, 'amount')
      this.totalPayments = _.round(totalPayments, 2)
    }

    // this.editSectionId = 'general'
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

    if (!this.object)
      return

    console.error(this.editSectionId)
    console.error(this.object)

    if (this.object.used < this.object.value)
      this.object.isConsumed = false


    switch (this.editSectionId) {

      default:
        this.saveSection(this.sectionProps, this.editSectionId)
    }

  }



  searchContact() {
    this.searchContactModal.show()
  }


  setContact(contact: Contact) {

    this.object.from = contact
    this.object.fromId = contact.id

  }

  alteaDb: AlteaDb
  msg: Message
  sendResult: ApiResult<Message>   // filled in after sending message
  //msgTo: Message

  clearCommunication() {
    this.msg = null
    this.sendResult = null
  }

  async send() {

    if (!this.alteaDb)
      this.alteaDb =  new AlteaDb(this.backendSvc)

    this.sendResult = await this.alteaDb.db.sendMessage$(this.msg)
    console.warn(this.sendResult)
    return this.sendResult
  }


  async preview() {

    this.sendResult = null

    console.warn(this.templateCode)

    if (!this.alteaDb)
      this.alteaDb =  new AlteaDb(this.backendSvc)

    let giftMsg = new GiftMessaging(this.alteaDb)

    const branch = await this.sessionSvc.branch$()

    let res = await giftMsg.send(branch, this.object, this.templateCode, false)

    this.msg = res.object

    console.log(res)


  }





}

