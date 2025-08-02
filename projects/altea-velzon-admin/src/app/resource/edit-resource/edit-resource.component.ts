import { Component, ViewChild, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ProductService, PriceService, ProductResourceService, ResourceService, ScheduleService, SessionService } from 'ng-altea-common'
import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule, User } from 'ts-altea-model'
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
import { ResourceGroupMode, ResourceGroupsComponent } from '../resource-groups/resource-groups.component';
import { NgForm } from '@angular/forms';
import { ScheduleComponent } from '../schedule/schedule.component';


@Component({
  selector: 'ngx-altea-edit-resource',
  templateUrl: './edit-resource.component.html',
  styleUrls: ['./edit-resource.component.scss'],
})
export class EditResourceComponent extends NgEditBaseComponent<Resource> implements OnInit {

  @ViewChild('deleteModal') public deleteModal: DeleteModalComponent;

  @ViewChild('resourceGeneralForm') resourceGeneralForm: NgForm;

  // @ViewChild('scheduleComponent') scheduleComponent: ScheduleComponent;
  @ViewChildren(ScheduleComponent) scheduleComponents: QueryList<ScheduleComponent>

  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
    // get successUrl() { return '/aqua/resources' + }
  }


  @ViewChild('resourceGroups') public resourceGroupsComponent: ResourceGroupsComponent;

  Array = Array

  ResourceType = ResourceType
  ResourceTypeIcons = ResourceTypeIcons
  ResourceGroupMode = ResourceGroupMode

  scheduleChanges?: CollectionChangeTracker<Schedule>

  resourceTypes: Translation[] = []

  public saveScheduling$: Rx.Subject<any> = new Rx.Subject<any>()

  constructor(protected resourceSvc: ResourceService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService,
    protected scheduleSvc: ScheduleService, protected sessionSvc: SessionService) {
    super('resource', Resource, 'groups.group,schedules:orderBy=idx.planning,children.child,user'
      , resourceSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['name', 'short', 'descr', 'color', 'start', 'end', 'isGroup', 'type', 'customSchedule', 'online', 'pos', 'userId', 'qty'])   // , 'color'
    this.sectionProps.set('schedule', ['schedules'])
  }

  override async ngOnInit() {
    super.ngOnInit()
    await this.translationSvc.translateEnum(ResourceType, 'enums.resource-type.', this.resourceTypes)
  }


  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/resources/' + this.object.type
    this.deleteConfig.successUrlMobile = '/aqua/resources/mobile/' + this.object.type
    this.deleteModal?.delete()
  }

  override objectRetrieved(object: Resource): void {

    console.error('objectRetrieved')
    console.error(object)



    this.scheduleChanges = new CollectionChangeTracker<Schedule>(this.object.schedules, Schedule, {
      propsToUpdate: ['weeks', 'name', 'default', 'prepIncl', 'start', 'scheduleIds', 'exclProds'], propsToRemove: ['planning']
    })

    if (!this.object.schedules)
      this.object.schedules = []

  }


  rangePickerChanged(event: any) {

    console.error(event)
    console.error(this.object['start'])

  }

  get start(): Date {

    if (this.object.start)
      return DateHelper.parse(this.object.start)
    else
      return null

    // return this.object.start
  }


  set start(value: Date) {

    if (value)
      this.object.start = DateHelper.yyyyMMddhhmmssiii(value)
    else
      this.object.start = null
    //this.object.start = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 6))
  }


  get end(): Date {
    return DateHelper.parse(this.object.start)
    //return this.object.end
  }


  set end(value: Date) {
    this.object.end = DateHelper.yyyyMMddhhmmssiii(value)
    // this.object.end = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 21))
  }



  startEditSection(sectionId: string, sectionParam: string) {
    console.log('Start edit section', sectionId, sectionParam)

    switch (sectionId) {

      case "general":
        this.resourceGeneralForm.form.markAsPristine()
        break
      case "schedule":
        // this.scheduleChanges = new CollectionChangeTracker<Schedule>(this.object.schedules, Schedule, {
        //   propsToUpdate: ['weeks'], propsToRemove: ['scheduling']
        // })
        this.scheduleChanges.updateId(sectionParam)
        break
    }

  }


  async deleteSchedule(schedule: Schedule, idx: number) {

    console.warn('deleteSchedule')
    this.object.schedules.splice(idx, 1)

    var res = await this.scheduleSvc.delete$(schedule.id, this.dashboardSvc.resourceId)

    console.log(res)

  }


  createSchedule() {

    console.error(this.object.schedules)


    const newSchedule = new Schedule()

    // newSchedule.name = "default"
    newSchedule.branchId = this.sessionSvc.branchId
    newSchedule.resourceId = this.object.id

    newSchedule.idx = this.scheduleChanges.maxValue('idx') + this.sessionSvc.idxStep
    newSchedule.default = !this.scheduleChanges.hasPropertyValue('default', true)

    // max idx + 100
    // if not already default: make default


    //this.object.schedules.push(newSchedule)
    this.scheduleChanges.add(newSchedule)   //  createId(newSchedule.id)

    console.error(newSchedule)
  }


  async saveSchedule(scheduleId: string) {

    // this.scheduleComponent.save()

    const currentSchedule = this.object.schedules.find(s => s.id === scheduleId)

    const scheduleComponent = this.scheduleComponents.find(sc => sc.schedule.id == scheduleId && !sc.readonly)

    if (scheduleComponent)
      scheduleComponent.save()

    const batch = this.scheduleChanges?.getApiBatch()

    console.error(batch)

    if (!batch || !batch.hasChanges()) {
      this.editSectionId = ''
      return
    }

    const res = await this.scheduleSvc.batchProcess$(batch, this.dashboardSvc.resourceId)
    console.error('batchProcess')
    console.error(res)

    if (res.status === ApiStatus.ok) {
      this.editSectionId = ''
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
      this.scheduleChanges.reset()
      await this.resourceSvc.refreshCachedObjectFromBackend(this.object.id)
    } else {
      this.dashboardSvc.showToastType(ToastType.saveError)
    }

    this.saveScheduling$.next(currentSchedule)

  }

  save() {

    console.error(this.editSectionId)
    console.error(this.object)


    switch (this.editSectionId) {

      case "schedule":
        console.error("Saving schedule")
        this.saveSchedule(this.editSectionParam)

        break

      case "groups":

        this.resourceGroupsComponent.save()
        break

      default:
        this.saveSection(this.sectionProps, this.editSectionId)




    }

  }

  linkUserToResource(user: User) {
    console.error(user)
    if (user) {
      this.object.userId = user.id
      this.object.user = user
      this.resourceGeneralForm.form.markAsDirty()
    }

  }


  unlinkUser() {

    if (this.object.userId) {
      this.object.userId = null
      this.object.user = null
      this.resourceGeneralForm.form.markAsDirty()
    }

  }

  cloneSchedule(schedule: Schedule) {

    console.error(schedule)

    const newSchedule = schedule.clone()

    newSchedule.idx = this.scheduleChanges.maxValue('idx') + this.sessionSvc.idxStep
    newSchedule.default = !this.scheduleChanges.hasPropertyValue('default', true)

    this.scheduleChanges.add(newSchedule)   //  createId(newSchedule.id)

    console.error(newSchedule)


   // this.object.schedules.push(newSchedule)

  }

}
