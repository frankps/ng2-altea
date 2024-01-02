import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductService, PriceService, ProductResourceService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource } from 'ts-altea-model'
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

  nrOfPeople = [1, 2, 3, 4]
  vatPcts = [0, 6, 12, 21]
  gender: Translation[] = []
  onlineMode: Translation[] = []
  daysOfWeekShort: Translation[] = []
  staff = 2

  // id = ''

  // origObject?: Product

  // objectType = 'product'
  // object?: Product


  price?: Price

  // editSection = ''

  priceChanges?: CollectionChangeTracker<Price>
  resourceChanges?: CollectionChangeTracker<ProductResource>


  productResourcePropsToUpdate = ['offset', 'duration', 'resourceId', 'idx', 'durationMode', 'reference', 'scheduleIds', 'groupQty', 'groupAlloc']

  OnlineMode = OnlineMode

  // deleteTransParams = { article: undefined, object_sc: '', object_lc: '', name: '' }

  constructor(public manageProductSvc: ManageProductService, protected productSvc: ProductService, private priceSvc: PriceService,
    private productResourceSvc: ProductResourceService,
    private translationSvc: TranslationService, route: ActivatedRoute, protected router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal,
    dashboardSvc: DashboardService) {

    super('product', Product, 'prices,options:orderBy=idx.values:orderBy=idx,items:orderBy=idx,resources:orderBy=idx.resource'
      , productSvc
      , route, spinner, dashboardSvc)

    this.translationSvc.translateEnum(Gender, 'enums.gender.', this.gender)
    this.translationSvc.translateEnum(OnlineMode, 'enums.online-mode.', this.onlineMode, true)



    // this.route.params.subscribe(params => {

    //   console.error('edit-product')

    //   console.error(params)

    //   if (params && params['id']) {
    //     const id = params['id']

    //     if (id == this.id)
    //       return

    //     this.getObject(id)


    //   }

    // })


    this.processParametersForNew()
  }

  // sectionProps = new Map<string, string[]>()


  async ngOnInit() {

    // delete
    //  this.objectName = 'Product'



    const daysOfWeekShort = await this.translationSvc.translateEnum(DaysOfWeekShort, 'enums.days-of-week-short.', this.daysOfWeekShort)

    // make sure monday=1, ... saturday=6, sunday=0
    let value = 1
    daysOfWeekShort.forEach(day => day.value = value++ % 7)

    this.sectionProps.set('general', ['name', 'descr', 'salesPrice', 'vatPct', 'color', 'personSelect', 'staffSelect'])
    this.sectionProps.set('planning', ['duration', 'hasPre', 'preTime', 'hasPost', 'postTime', 'planMode', 'plan'])
    this.sectionProps.set('serviceDetails', ['customers', 'gender', 'online', 'showPrice', 'duration', 'spacingAfter'])
    // pricing
    this.sectionProps.set('pricing', ['prices'])  //'prices'
    this.sectionProps.set('visibility', ['online', 'showPrice', 'showDuration'])  // , 'showPos'

    this.sectionProps.set('options', ['options'])
    this.sectionProps.set('rules', ['rules'])

  }

  initProductResourceChangeTracker(product: Product) {
    this.resourceChanges = new CollectionChangeTracker<ProductResource>(product.resources, ProductResource, {
      propsToUpdate: this.productResourcePropsToUpdate,
      propsToRemove: ['resource']
    })

  }

  override objectRetrieved(object: Product): void {

    object.prices = _.orderBy(object?.prices, ['idx'], ['desc'])

    if (object.options)
      object.options = _.orderBy(object.options, 'idx')
    else
      object.options = []



    const priceChangeParams = new CollectionChangeTrackerParams()
    priceChangeParams.propsToRemove = ['_startDate', '_endDate']
    priceChangeParams.orderByProps = ['idx']

    this.priceChanges = new CollectionChangeTracker<Price>(object.prices, Price, priceChangeParams)

    this.initProductResourceChangeTracker(object)


    this.manageProductSvc.showPathForProduct(object)
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





  getObjectOld(id: string) {


    this.spinner.show()

    // 'ff2696c8-0c58-477f-b7dd-2ff18cdcaf57'
    // include=options:orderBy=name.values:orderBy=name,prices
    this.productSvc.get(id, 'prices,options:orderBy=idx.values:orderBy=idx,items:orderBy=idx,resources:orderBy=idx.resource').subscribe(res => {   // .values

      //  res.gender = Gender.unisex
      this.object = res as Product

      this.object.prices = _.orderBy(this.object?.prices, ['idx'], ['desc'])

      this.resetOrigObject()

      console.error(this.object)

      console.error(this.origObject)

      //     this.object.prices = _.sortBy(this.object.prices, p => p.start ? p.start : new Date(1900, 0, 1))  // Date(1900,0,1): we need to get null values first!


      const priceChangeParams = new CollectionChangeTrackerParams()
      priceChangeParams.propsToRemove = ['_startDate', '_endDate']


      this.priceChanges = new CollectionChangeTracker<Price>(this.object.prices, Price, priceChangeParams)


      this.editSectionId = '' // 'timing'
      // TO REMOVE
      this.initProductResourceChangeTracker(this.object)

      this.manageProductSvc.showPathForProduct(this.object)

      this.spinner.hide()
      console.error(res)
    })
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
  
      const res = await this.priceSvc.batchProcess$(priceBatch)
  
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
  
        const prodUpdate = await this.objectSvc.update$(update)
  
        if (!prodUpdate.isOk)
          allOk = false
  
        console.error(prodUpdate)
  
  
      }

    } catch(err) {

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


  saveResources() {
    const batch = this.resourceChanges?.getApiBatch()

    if (!batch || !batch.hasChanges()) {
      this.editSectionId = ''
      return
    }
    console.error('Price changes')
    console.error(batch)

    this.productResourceSvc.batchProcess(batch).subscribe(res => {

      this.resetOrigObject()

      console.error(res)
      this.editSectionId = ''

      this.priceChanges?.reset()
    })

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

      this.productSvc.create(this.object).subscribe(res => {

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

    this.productSvc.update(update).subscribe(res => {

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


  async addPrice() {

    if (!this.object?.id)
      return

    let title : string = await this.translationSvc.getTrans("objects.price.title-tpl")

    
    title = title.replace('*',this.object.name)

    console.warn(title)

    const price = new Price(this.object?.id, title)

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
    this.deleteModal?.delete()
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
