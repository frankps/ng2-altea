
import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, UserService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, DepositMode, User, ProviderIcon } from 'ts-altea-model'
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
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent extends NgEditBaseComponent<User> implements OnInit {
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

  mobilePhoneCss = {
    row: 'row mt-3',
    colPrefix: 'col-2',
    colLocalNum: 'col-4'
  }

  ProviderIcon =  ProviderIcon

  constructor(protected userSvc: UserService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected scheduleSvc: ScheduleService, protected sessionSvc: SessionService) {
    super('user', User, 'contacts.branch,resources.branch'
      , userSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['first', 'last', 'email', 'mobile'])
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




  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/platform/users/'
    this.deleteConfig.successUrlMobile = '/platform/users/mobile/'
    this.deleteModal?.delete()
  }

  override async objectRetrieved(user: User) {

    console.error('objectRetrieved')
    console.error(user)



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



}

