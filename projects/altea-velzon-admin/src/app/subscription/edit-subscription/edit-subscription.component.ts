import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, GiftService, SubscriptionService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, Gift, Subscription } from 'ts-altea-model'
import { BackendHttpServiceBase, DashboardService, FormCardSectionEventData, NgEditBaseComponent, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, ObjectWithId, CollectionChangeTracker, ApiStatus, DateHelper, ArrayHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { scheduled } from 'rxjs';
import * as Rx from "rxjs";
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-subscription',
  templateUrl: './edit-subscription.component.html',
  styleUrls: ['./edit-subscription.component.scss'],
})
export class EditSubscriptionComponent extends NgEditBaseComponent<Subscription> {

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

  constructor(protected subscriptionSvc: SubscriptionService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected sessionSvc: SessionService) {
    super('subscription', Subscription, 'contact,order,payments.order'
      , subscriptionSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['name', 'remark', 'totalQty', 'usedQty'])
    // this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    // this.translationSvc.translateEnum(Language, 'enums.language.', this.language)

  }


  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/subscriptions/'
    this.deleteConfig.successUrlMobile = '/aqua/subscriptions/mobile/'
    this.deleteModal?.delete()
  }

  override objectRetrieved(object: Subscription): void {

    console.error('objectRetrieved')
    console.error(object)


    if (ArrayHelper.NotEmpty(object?.payments)) {
      object.payments = _.orderBy(object.payments, pay => pay.order?.start, ['desc'])
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

    console.error(this.editSectionId)
    console.error(this.object)

    switch (this.editSectionId) {

      default:
        this.saveSection(this.sectionProps, this.editSectionId)
    }

  }




}


