
import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language } from 'ts-altea-model'
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
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import * as countryLib from 'country-list-js';


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

  countries: any[] = []
  // scheduleChanges?: CollectionChangeTracker<Schedule>

  depositPctgs = [...Array(21).keys()].map(i => { return { pct: (i * 5), label: `${i * 5} %` } })
  depositMode: 'default' | 'custom' = "default"   // default or custom

  mobilePhoneCss = {
    row: 'row mt-3',
    colPrefix: 'col-2',
    colLocalNum: 'col-4'
  }


  test = "31478336034"

  public saveScheduling$: Rx.Subject<any> = new Rx.Subject<any>()

  constructor(protected contactSvc: ContactService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected scheduleSvc: ScheduleService, protected sessionSvc: SessionService) {
    super('contact', Contact, 'subscriptions,giftsIn,giftsOut,cards'
      , contactSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['first', 'last', 'gender', 'birth', 'email', 'emailRemind', 'mobile', 'smsRemind', 'language', 'depositPct'])
    this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    this.translationSvc.translateEnum(Language, 'enums.language.', this.language)

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

  override async objectRetrieved(contact: Contact) {

    console.error('objectRetrieved')
    console.error(contact)

    if (contact?.depositPct)
      this.depositMode = "custom"
    else
      this.depositMode = "default"

    await this.getMessages(contact)


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




}
