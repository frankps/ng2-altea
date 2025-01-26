
import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, ContactService, SessionService, GiftService, LoyaltyProgramService } from 'ng-altea-common'
import { LoyaltyUnit, Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, Contact, Language, Gift, LoyaltyProgram, LoyaltyProduct, LoyaltyProductMode, LoyaltyReward } from 'ts-altea-model'
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
import { SearchProductComponent } from '../../product/search-product/search-product.component';
import { LoyaltyRewardComponent } from '../loyalty-reward/loyalty-reward.component';

@Component({
  selector: 'app-edit-loyalty-program',
  templateUrl: './edit-loyalty-program.component.html',
  styleUrls: ['./edit-loyalty-program.component.scss']
})
export class EditLoyaltyProgramComponent extends NgEditBaseComponent<LoyaltyProgram> implements OnInit {

  css_cls_row = 'mt-3'

  //  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;

  @ViewChild('deleteModal') public deleteModal: DeleteModalComponent;

  @ViewChild('generalForm') generalForm: NgForm;

  @ViewChild('searchProductModal') public searchProductModal: SearchProductComponent;


  @ViewChild('rewardModal') public rewardModal?: LoyaltyRewardComponent;


  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
    // get successUrl() { return '/aqua/resources' + }
  }

  Array = Array

  newReward = true
  reward = new LoyaltyReward()

  initialized = false
  loyaltyUnit: Translation[] = []



  // gender: Translation[] = []
  // language: Translation[] = []

  // scheduleChanges?: CollectionChangeTracker<Schedule>
  // public saveScheduling$: Rx.Subject<any> = new Rx.Subject<any>()

  constructor(protected loyaltyProgramSvc: LoyaltyProgramService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected sessionSvc: SessionService) {
    super('loyalty-program', LoyaltyProgram, null
      , loyaltyProgramSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['act', 'name', 'track', 'incl', 'excl', 'prod', 'svc_basic', 'svc_bundle', 'svc_subs', 'promo', 'idx'])  // , 'prod', 'svc_basic', 'svc_bundle', 'svc_subs', 'promo'
    this.sectionProps.set('rewards', ['rewards'])  // , 'prod', 'svc_basic', 'svc_bundle', 'svc_subs', 'promo'

    // this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    // this.translationSvc.translateEnum(Language, 'enums.language.', this.language)

  }

  override async ngOnInit() {

    super.ngOnInit()


    await this.translationSvc.translateEnum(LoyaltyUnit, 'enums.loyalty-unit.', this.loyaltyUnit)

    this.initialized = true

  }


  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/contacts/'
    this.deleteConfig.successUrlMobile = '/aqua/contacts/mobile/'
    this.deleteModal?.delete()
  }

  override objectRetrieved(object: LoyaltyProgram): void {

    console.error('objectRetrieved')
    console.error(object)

    /*
    object.incl = []
    object.incl.push(new LoyaltyProduct(LoyaltyProductMode.id, 'Wellness', 'abc'))
*/





    // this.editSectionId = 'general'
  }

  isDirty() {
    return (!this.generalForm?.form.pristine || this.productListsChanged) && this.generalForm?.form.valid
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

    /*
    if (this.object.used < this.object.value)
      this.object.isConsumed = false
*/

    switch (this.editSectionId) {

      default:
        this.saveSection(this.sectionProps, this.editSectionId)
    }

    this.productListsChanged = false
  }

  target: 'incl' | 'excl' = 'incl'

  addProducts(target: 'incl' | 'excl') {
    this.target = target
    this.searchProductModal.show()
  }

  productListsChanged = false

  productsSelected(products: Product[]) {

    console.warn(products)

    if (ArrayHelper.IsEmpty(products))
      return

    const loyaltyProducts = products.map(p => LoyaltyProduct.fromProduct(p))

    if (!this.object[this.target])
      this.object[this.target] = []

    this.object[this.target].push(...loyaltyProducts)

    this.productListsChanged = true
  }


  deleteProduct(target: 'incl' | 'excl', loyaltyProduct: LoyaltyProduct, idx: number) {

    if (!this.object[target])
      return

    // 

    this.object[target].splice(idx, 1)
    this.productListsChanged = true

  }

  deleteReward(reward, idx) {
    if (!this.object.rewards)
      return

    this.object.rewards.splice(idx, 1)
    this.productListsChanged = true
  }

  saveReward(reward: LoyaltyReward) {

    console.error(reward)

    if (!reward)
      return

    if (!this.object.rewards)
      this.object.rewards = []

    if (this.newReward)
      this.object.rewards.push(reward)
    //    this.reward = new LoyaltyReward()

    this.object.rewards = _.orderBy(this.object.rewards, 'amount')


    this.productListsChanged = true
  }


  editRewardIdx = -1

  async editReward(reward: LoyaltyReward, idx: number) {

    if (!this.sectionInEditIs('rewards'))
      return

    this.editRewardIdx = idx

    this.newReward = false
    this.reward = reward

    console.warn('EDIT REWARD', this.reward)

    await this.rewardModal.show(reward)

  }


  startNewReward() {
    this.newReward = true
    this.reward = new LoyaltyReward()
    this.rewardModal.show(this.reward)
  }


  /*
    searchContact() {
      this.searchContactModal.show()
    }
  
  
    setContact(contact: Contact) {
  
      this.object.from = contact
      this.object.fromId = contact.id
  
    }
  */




}

