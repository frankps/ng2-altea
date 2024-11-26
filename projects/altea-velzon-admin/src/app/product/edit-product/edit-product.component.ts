import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, SessionService, ResourceService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ProductSubType, PriceCondition } from 'ts-altea-model'
import { DashboardService, FormCardSectionEventData, NgEditBaseComponent, ToastType, TranslationService } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, CollectionChangeTracker, ObjectWithId, ApiStatus, CollectionChangeTrackerParams } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { ManageProductService } from '../manage-product.service';
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { ConnectTo } from 'ts-common'


/*

ng generate service loyaltyCard --project=ng-altea-common

ng generate module loyalty --routing --project=altea-velzon-admin

ng generate component loyalty/manage-loyalty-programs --project=altea-velzon-admin
ng generate component loyalty/edit-loyalty-program --project=altea-velzon-admin
ng generate component loyalty/loyalty-program-list --project=altea-velzon-admin



*/

@Component({
  selector: 'ngx-altea-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
})
export class EditProductComponent extends NgEditBaseComponent<Product> implements OnInit {

  Array = Array

  ProductType = ProductType
  ProductTypeIcons = ProductTypeIcons
  time = {}


  @ViewChild('deleteModal') public deleteModal: DeleteModalComponent;

  @ViewChild('priceModal') public priceModal: NgxModalComponent;
  //  @ViewChild('deleteModal') public deleteModal?: NgxModalComponent; // NgTemplateOutlet | null = null

  css_cls_row = 'mt-3'
  initialized = false

  nrOfPeople = [1, 2, 3, 4]
  vatPcts = [0, 6, 12, 21]
  gender: Translation[] = []
  onlineMode: Translation[] = []
  daysOfWeekShort: Translation[] = []
  productType: Translation[] = []
  productSubType: Translation[] = []

  staff = 2

  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
  }

  // id = ''

  // origObject?: Product

  // objectType = 'product'
  // object?: Product


  price?: Price

  // editSection = ''

  priceChanges?: CollectionChangeTracker<Price>
  resourceChanges?: CollectionChangeTracker<ProductResource>


  productResourcePropsToUpdate = ['offset', 'duration', 'resourceId', 'idx', 'durationMode', 'reference', 'scheduleIds', 'groupQty', 'groupAlloc', 'prep', 'prepOverlap', 'flex', 'flexAfter']

  OnlineMode = OnlineMode

  // deleteTransParams = { article: undefined, object_sc: '', object_lc: '', name: '' }

  constructor(public manageProductSvc: ManageProductService, protected sessionSvc: SessionService, protected productSvc: ProductService, private priceSvc: PriceService,
    private productResourceSvc: ProductResourceService, protected resourceSvc: ResourceService,
    private translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal,
    dashboardSvc: DashboardService) {

    super('product', Product, 'prices:orderBy=idx,options:orderBy=idx.values:orderBy=idx,items:orderBy=idx,resources:orderBy=idx.resource'
      , productSvc
      , router, route, spinner, dashboardSvc)






    this.processParametersForNew()
  }

  // sectionProps = new Map<string, string[]>()

  //condition: PriceCondition

  override async ngOnInit() {
    super.ngOnInit()

    // this.condition = new PriceCondition()
    // delete
    //  this.objectName = 'Product'



    const daysOfWeekShort = await this.translationSvc.translateEnum(DaysOfWeekShort, 'enums.days-of-week-short.', this.daysOfWeekShort)

    // make sure monday=1, ... saturday=6, sunday=0
    let value = 1
    daysOfWeekShort.forEach(day => day.value = value++ % 7)

    this.sectionProps.set('general', ['name', 'descr', 'inform', 'salesPrice', 'vatPct', 'color', 'personSelect', 'staffSelect', 'priceFrom', 'priceInfo', 'type', 'sub', 'minQty'])
    this.sectionProps.set('planning', ['duration', 'hasPre', 'preTime', 'hasPost', 'postTime', 'planMode', 'plan'])
    this.sectionProps.set('serviceDetails', ['customers', 'gender', 'online', 'showPrice', 'duration', 'spacingAfter'])
    // pricing
    this.sectionProps.set('pricing', ['prices'])  //'prices'
    this.sectionProps.set('visibility', ['online', 'showPrice', 'showDuration', 'showPos'])  // , 'showPos'

    this.sectionProps.set('options', ['options'])
    this.sectionProps.set('rules', ['rules'])

    await this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    await this.translationSvc.translateEnum(OnlineMode, 'enums.online-mode.', this.onlineMode, false, true)
    await this.translationSvc.translateEnum(ProductType, 'enums.product-type.', this.productType)
    await this.translationSvc.translateEnum(ProductSubType, 'enums.product-sub-type.', this.productSubType)
    this.initialized = true
  }

  initProductResourceChangeTracker(product: Product) {
    this.resourceChanges = new CollectionChangeTracker<ProductResource>(product.resources, ProductResource, {
      propsToUpdate: this.productResourcePropsToUpdate,
      propsToRemove: ['resource']
    })

  }

  override async objectRetrieved(object: Product): Promise<void> {


    object.prices = _.orderBy(object?.prices, ['idx'], ['asc'])

    if (object.options)
      object.options = _.orderBy(object.options, 'idx')
    else
      object.options = []



    const priceChangeParams = new CollectionChangeTrackerParams()
    priceChangeParams.propsToRemove = ['_startDate', '_endDate']
    priceChangeParams.orderByProps = ['idx']

    this.priceChanges = new CollectionChangeTracker<Price>(object.prices, Price, priceChangeParams)

    this.initProductResourceChangeTracker(object)


    await this.manageProductSvc.showPathForProduct(object)
  }


  async processParametersForNew() {


    this.route.params.subscribe(async params => {

      console.log(params)


      if (params['type']) {

        console.log(params)
        const type = params['type']
        console.warn(type)

        this.object = new Product()
        this.object.type = type
        //  this.object.orgId = "66e77bdb-a5f5-4d3d-99e0-4391bded4c6c"

        this.object.organisation = new ConnectTo("66e77bdb-a5f5-4d3d-99e0-4391bded4c6c")
        this.object.branch = new ConnectTo("66e77bdb-a5f5-4d3d-99e0-4391bded4c6c")

      }

    })
  }


  startEditSection(sectionId: string, sectionParam: string) {
    console.log('Start edit section', sectionId, sectionParam)

    switch (sectionId) {

    }

  }




  /** origObject is used to retrieve previous values when user cancels an edit */
  // resetOrigObject() {
  //   this.origObject = ObjectHelper.clone(this.object, Product)
  // }


  show() {
    console.error(this.object)
  }

  /** experimental method to batch update */
  save2(event: unknown) {




    /*
    const batch = new ApiBatchProcess<Price>()

    if (this.object?.prices && this.object.prices.length > 0) {

      batch.update = this.object.prices

      this.priceSvc.batch(batch).subscribe(res => {

        console.error(res)
      })
    }
*/

  }

  hasActivePrices() {

    if (!this.Array.isArray(this.object?.prices) || this.object?.prices.length == 0)
      return false

    const now = new Date()

    const firstActivePrice = this.object?.prices.find(price => (price.start && price.startDate > now) || !price.start || !price.end || (price.end && price.endDate > now))

    return firstActivePrice ? true : false
  }


  async savePrices() {

    let allOk = true

    try {

      const priceBatch = this.priceChanges?.getApiBatch()

      if (!priceBatch || !priceBatch.hasChanges()) {
        this.editSectionId = ''
        return
      }
      console.error('Price changes')
      console.error(priceBatch)

      const hasActivePrices = this.hasActivePrices()

      const res = await this.priceSvc.batchProcess$(priceBatch, this.dashboardSvc.resourceId)

      if (res.status != ApiStatus.ok)
        allOk = false

      this.resetOrigObject()

      console.error(res)
      this.editSectionId = ''

      this.priceChanges?.reset()

      if (this.object.advPricing != hasActivePrices) {

        this.object.advPricing = hasActivePrices

        const update: any = {}
        update['id'] = this.object?.id
        update['advPricing'] = hasActivePrices

        const prodUpdate = await this.objectSvc.update$(update, this.dashboardSvc.resourceId)

        if (!prodUpdate.isOk)
          allOk = false

        console.error(prodUpdate)


      }

    } catch (err) {

      allOk = false

    } finally {

      if (allOk) {
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
      } else {
        this.dashboardSvc.showToastType(ToastType.saveError)
      }


    }

    //this.object.advPricing = true
    //console.error(priceBatch)
  }


  async saveResources() {
    const batch = this.resourceChanges?.getApiBatch()

    console.error(batch)

    if (!batch || !batch.hasChanges()) {
      this.editSectionId = ''
      return
    }
    console.error('Price changes')
    console.error(batch)

    const res = await this.productResourceSvc.batchProcess$(batch, this.dashboardSvc.resourceId)

    this.resetOrigObject()

    console.error(res)
    this.editSectionId = ''


    if (res.status == ApiStatus.ok) {
      this.resourceChanges?.reset()
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
      await this.productSvc.refreshCachedObjectFromBackend(this.object.id)
    } else {
      this.dashboardSvc.showToastType(ToastType.saveError)
    }




    console.error(batch)
  }


  /** deprecated */
  saveSectionOld(sectionProps: Map<string, string[]>, editSection: string) {


    this.spinner.show()

    console.error(`Start saving section ${editSection}`)

    if (!this.object) {
      console.error(`Can't save: object is undefined!`)
    }


    if (!this.object?.id) {
      // then this is a new object => we save instead of update!

      this.productSvc.create(this.object, this.dashboardSvc.resourceId).subscribe(res => {

        console.log('Object saved')
        console.error(res)

        if (res.status == ApiStatus.ok) {
          this.object = res.object
          this.dashboardSvc.showToastType(ToastType.saveSuccess)
        } else {
          this.dashboardSvc.showToastType(ToastType.saveError)
        }

        this.spinner.hide()

      })


      this.editSectionId = ''


      return
    }


    const propsToUpdate = sectionProps.get(editSection)

    const update: any = {}
    update['id'] = this.object?.id

    const obj: any = this.object

    if (!propsToUpdate) {

      console.log(`No properties to update ... `)
      this.spinner.hide()
      this.editSectionId = ''
      return
    }

    propsToUpdate.forEach(prop => {
      if (this.object)
        update[prop] = obj[prop]
    })

    console.error('Sending update:')
    console.warn(update)

    this.productSvc.update(update, this.dashboardSvc.resourceId).subscribe(res => {

      this.resetOrigObject()
      console.error(res)

      this.spinner.hide()
    })

    this.editSectionId = ''
  }

  cancelOld() {
    const propsToUpdate = this.sectionProps.get(this.editSectionId)

    if (!propsToUpdate || !this.object || !this.origObject) {
      this.editSectionId = ''
      return
    }

    propsToUpdate.forEach(prop => {

      (this.object as any)[prop] = (this.origObject as any)[prop]
    })

    this.editSectionId = ''
  }


  save() {

    console.error(this.editSectionId)
    console.error(this.object)

    switch (this.editSectionId) {

      case 'pricing':
        this.savePrices()
        break

      case 'resources':
        this.saveResources()
        break

      default:
        this.saveSection(this.sectionProps, this.editSectionId)




    }

  }


  getDaysOfWeek(price: Price): string {

    if (!price)
      return ''

    const days = []

    for (let i = 1; i <= 7; i++) {

      if (price.days[i % 7])
        days.push(this.daysOfWeekShort[i - 1].trans)

    }

    return days.join(', ')

  }

  /*
if (this.editSection == 'pricing') {
  console.error('pricing')

  let price = new Price()

  if (this.object?.prices && this.object.prices.length > 0) {
  
      price = this.object.prices[0]
  }

  update['prices'] = {
    updateMany: {
      where: { value: 18},
      data: { value: 19}
    }
  }
}
*/


  override editModeChanged(cardSectionChanged: FormCardSectionEventData) {


    switch (cardSectionChanged.sectionId) {
      case 'resources':
        this.initProductResourceChangeTracker(this.object)
        break
    }

    super.editModeChanged(cardSectionChanged)

    // console.log(cardSectionChanged)

    // if (!cardSectionChanged)
    //   return

    // if (cardSectionChanged.editable)
    //   this.editSection = cardSectionChanged.sectionId
    // else
    //   this.editSection = ""

  }


  editPrice(price: Price) {

    if (!price)
      return

    console.error(price)

    price.initDays()

    this.price = price

    this.priceChanges?.updateId(price.id)

    this.priceModal?.show()

  }

  deletePrice(price: Price) {
    if (!price)
      return

    this.priceChanges?.delete(price)
  }

  movePriceUp(price: Price, arrayIdx: number) {

    var prices = this.priceChanges.orderedCol()

    let prevPrice = prices[arrayIdx - 1]

    let currentPriceIdx = price.idx
    price.idx = prevPrice.idx
    prevPrice.idx = currentPriceIdx
  }


  async addPrice() {

    if (!this.object?.id)
      return

    /*     let title: string = await this.translationSvc.getTrans("objects.price.title-tpl")
    
        title = title.replace('*', this.object.name)
    
        console.warn(title)
     */

    const price = new Price(this.object?.id, '')

    const priceMaxIdx = _.maxBy(this.object.prices, 'idx')

    console.error(priceMaxIdx)

    if (priceMaxIdx) {
      price.idx = priceMaxIdx.idx + 10
    }

    console.error(price)

    price.value = this.object.salesPrice


    // this.object?.prices?.push(price)
    //this.object.prices = _.orderBy(this.object?.prices, ['idx'], ['desc'])

    this.priceChanges?.add(price)  // createId(price.id)

    this.price = price

    this.priceModal?.show()
  }







  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/catalog/' + this.object.type
    this.deleteConfig.successUrlMobile = `/aqua/catalog/${this.object.type}/mobile/`

    this.deleteModal?.delete()
  }


  deleted(object: Product) {


    console.error('Deleted')
    console.error(object)

    /*
    if (object.id == this.object.id)
      this.object = null
*/

  }

  /*
  
  
    async delete() {
  
      this.deleteTransParams.article = await this.translationSvc.getTrans('objects.product.article')
  
      this.deleteTransParams.object_sc = sc.sentencecase(this.objectName)
      this.deleteTransParams.object_lc = sc.lowercase(this.objectName)
      this.deleteTransParams.name = this.object.name
  
  
      console.error(this.deleteTransParams)
  
      this.modalService.open(this.deleteModal)
  
  
    }
  
    confirmDelete(modal) {
  
      this.spinner.show()
  
      const update = {
        id: this.object.id,
        deleted: true,
        deletedAt: new Date()
      }
  
      this.productSvc.update(update).subscribe(res => {
  
        console.error(res)
  
        const url = '/aqua/products/' + this.object.catId
  
        console.error(url)
  
        this.router.navigate([url])
  
  
        this.spinner.hide()
        modal.close()
      })
  
      console.error('Delete confirmed!')
  
  
    }
  
    cancelDelete(modal) {
  
  
      modal.close()
  
    }
  */




}
