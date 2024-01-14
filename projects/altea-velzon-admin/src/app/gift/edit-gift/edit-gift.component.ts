
import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, GiftService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, Gift } from 'ts-altea-model'
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
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';


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

  // gender: Translation[] = []
  // language: Translation[] = []

  // scheduleChanges?: CollectionChangeTracker<Schedule>
  // public saveScheduling$: Rx.Subject<any> = new Rx.Subject<any>()

  constructor(protected giftSvc: GiftService, protected translationSvc: TranslationService, route: ActivatedRoute, protected router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected sessionSvc: SessionService) {
    super('gift', Gift, 'from'
      , giftSvc
      , route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['value', 'used', 'isConsumed', 'fromName', 'fromEmail', 'toName', 'toEmail', 'toAddress', 'toMessage', 'toSendEmail', 'fromId'])
    // this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    // this.translationSvc.translateEnum(Language, 'enums.language.', this.language)

  }


  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/contacts/'
    this.deleteConfig.successUrlMobile = '/aqua/contacts/mobile/'
    this.deleteModal?.delete()
  }

  override objectRetrieved(object: Gift): void {

    console.error('objectRetrieved')
    console.error(object)

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

    console.error(this.editSectionId)
    console.error(this.object)

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





}

