
import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, BranchService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, Branch, DepositTerm, TimeUnit, MsgType, ReminderConfig, Country, GiftConfig, GiftVatPct, Currency } from 'ts-altea-model'
import { BackendHttpServiceBase, DashboardService, FormCardSectionEventData, NgEditBaseComponent, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, ObjectWithId, CollectionChangeTracker, ApiStatus, DateHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { scheduled } from 'rxjs';
import * as Rx from "rxjs";
import { NgForm } from '@angular/forms';


@Component({
  selector: 'app-edit-branch',
  templateUrl: './edit-branch.component.html',
  styleUrls: ['./edit-branch.component.scss']
})
export class EditBranchComponent extends NgEditBaseComponent<Branch> implements OnInit {

  Math = Math

  vatPctgs = [...Array(30).keys()].map(i => { return { pct: i, label: `${i} %` } })
  depositPctgs = [...Array(21).keys()].map(i => { return { pct: (i * 5), label: `${i * 5} %` } })

  cancelTimes = [...Array(5).keys()].map(i => { return { hours: (i * 24), label: `${i}` } })

  nrOfMonths = [...Array(60).keys()].map(i => i * 3)

  @ViewChild('generalForm') generalForm: NgForm;
  @ViewChild('depositForm') depositForm: NgForm;
  @ViewChild('remindersForm') remindersForm: NgForm;
  @ViewChild('giftForm') giftForm: NgForm;

  timeUnitsPlural: Translation[] = []
  timeUnitsSingular: Translation[] = []
  msgTypes: Translation[] = []
  countries: Translation[] = []
  languages: Translation[] = []
  currencies: Translation[] = []

  newReminder = new ReminderConfig()


  get timeUnits(): Translation[] {
    if (this.newReminder?.dur == 1)
      return this.timeUnitsSingular
    else
      return this.timeUnitsPlural

  }

  constructor(protected contactSvc: BranchService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected scheduleSvc: ScheduleService, protected sessionSvc: SessionService) {
    super('branch', Branch, ''
      , contactSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['name', 'descr', 'street', 'streetNr', 'postal', 'country', 'city', 'language', 'vatPcts', 'vatPct', 'vatNr', 'vatIncl', 'phone', 'mobile', 'email', 'cur', 'cancel'])
    this.sectionProps.set('communication', ['emailFrom', 'emailBcc', 'smsOn'])
    this.sectionProps.set('reminders', ['reminders'])
    this.sectionProps.set('deposit', ['depositPct', 'depositTerms', 'reminders'])
    this.sectionProps.set('gift', ['giftOn', 'gift'])

    // 

    const branchId = this.sessionSvc.branchId

    if (branchId)
      this.getObject(branchId)

    this.translationSvc.translateEnum(Language, 'enums.language.', this.languages)
    this.translationSvc.translateEnum(Currency, 'enums.currency.', this.currencies)
    this.translationSvc.translateEnum(Country, 'enums.country.', this.countries)
    this.translationSvc.translateEnum(MsgType, 'enums.msg-type.', this.msgTypes)
    this.translationSvc.translateEnum(TimeUnit, 'enums.time-units-plur.', this.timeUnitsPlural)
    this.translationSvc.translateEnum(TimeUnit, 'enums.time-units-sing.', this.timeUnitsSingular)

  }

  override ngOnInit() {
    super.ngOnInit()
  }

  override objectRetrieved(object: Branch): void {

    //this.editSectionId = 'gift'
  }

  save() {

    console.error(this.editSectionId)
    console.error(this.object)

    switch (this.editSectionId) {

      default:
        this.saveSection(this.sectionProps, this.editSectionId)
    }

    // make sure other components see the updates
    this.sessionSvc.branch = this.object

  }

  markAsDirty() {
    this.depositForm.form.markAsDirty()
    console.error('dirty')
  }

  startEditSection(sectionId: string, sectionParam: string) {
    console.log('Start edit section', sectionId, sectionParam)

    switch (sectionId) {

      case "general":
        //this.generalForm.form.markAsPristine()
        break

    }
  }


  addReminder() {

    if (!Array.isArray(this.object?.reminders))
      this.object.reminders = []

    this.object.reminders.push(this.newReminder)

    this.remindersForm.form.markAsDirty()


    this.newReminder = new ReminderConfig()


  }



  deleteReminder(idx: number) {

    this.object.reminders.splice(idx, 1)
    this.remindersForm.form.markAsDirty()

  }


  toggleGift() {

    if (this.object.giftOn && !this.object.gift)
      this.object.gift = new GiftConfig()


    console.warn(this.object.gift)
  }




  initGiftVatPcts() {

    if (!this.object.gift.invoice.on)
      return

    if (!this.object.gift.invoice.vatPcts)
      this.object.gift.invoice.vatPcts = []

    const vatPcts = this.object.gift.invoice.vatPcts

    for (let pct of this.object.vatPcts) {

      let giftVatPct = vatPcts.find(vat => vat.pct == pct)

      if (!giftVatPct) {

        giftVatPct = new GiftVatPct()
        giftVatPct.pct = pct
        giftVatPct.on = false
        giftVatPct.descr = ''

        vatPcts.push(giftVatPct)

      }

    }

  }



}
