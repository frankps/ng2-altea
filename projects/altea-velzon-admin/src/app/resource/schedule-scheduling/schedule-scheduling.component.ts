import { Component, Input, AfterViewInit, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { ResourcePlanning, Schedule, ScheduleTimeBlock, WeekSchedule, PlanningType } from 'ts-altea-model'
import { SelectedDay } from '../schedule-day/schedule-day.component';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, CollectionChangeTracker, ObjectWithId, DateHelper, ConnectTo, ApiStatus } from 'ts-common'
import { ResourcePlanningService, ResourceService, SessionService } from 'ng-altea-common'
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import * as dateFns from 'date-fns'
import { EditResourceComponent } from '../edit-resource/edit-resource.component';
//import { tr } from 'date-fns/locale';
import { Subscription } from "rxjs";
import { DashboardService, ToastType } from 'ng-common';

enum FormMode {
  readonly = 'readonly',
  editall = 'editall',
  add = 'add',
  editsingle = 'editsingle'
}

@Component({
  selector: 'ngx-altea-schedule-scheduling',
  templateUrl: './schedule-scheduling.component.html',
  styleUrls: ['./schedule-scheduling.component.scss'],
})
export class ScheduleSchedulingComponent implements OnDestroy {


  id = ObjectHelper.newGuid()

  @Input() set readonly(readonly: boolean) {

    if (readonly)
      this.mode = FormMode.readonly
    else
      this.mode = FormMode.editall
  }

  mode = FormMode.readonly

  _schedule: Schedule

  new: ResourcePlanning

  rangeSelection: Date[]

  changes?: CollectionChangeTracker<ResourcePlanning>

  date = new Date()

  // listenForSaveDone = false
  // _editResourceParent: EditResourceComponent

  saveSchedulingSubscription: Subscription


  // @Input() set editResourceParent(value: EditResourceComponent) {
  //   this._editResourceParent = value

  //   if (this._editResourceParent && !this.listenForSaveDone)
  //     this.listenForSave()
  // }

  @Input() set schedule(schedule: Schedule) {
    this._schedule = schedule

    if (!schedule)
      return

    if (!this._schedule.planning)
      this._schedule.planning = []

    this.changes = new CollectionChangeTracker<ResourcePlanning>(this._schedule.planning, ResourcePlanning)

    this.initNew()

    console.warn('SET')
    console.warn(schedule)
  }

  constructor(protected planningSvc: ResourcePlanningService, private localeService: BsLocaleService, protected sessionSvc: SessionService,
    protected resourceSvc: ResourceService, protected dashboardSvc: DashboardService) {

    const now = new Date()
    const utcNow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    this.rangeSelection = [utcNow, dateFns.addMonths(utcNow, 1)];

  }

  ngOnDestroy(): void {
    // this.ngUnsubscribe.next();
    // this.ngUnsubscribe.complete();
    if (this.saveSchedulingSubscription)
      this.saveSchedulingSubscription.unsubscribe()
  }


  /*
    listenForSave(): void {
  
      this.listenForSaveDone = true
      console.warn('>>> ngAfterViewInit')
      console.error(this._editResourceParent)
  
      this.saveSchedulingSubscription = this._editResourceParent.saveScheduling$.subscribe(scheduleToSave => {
  
        if (scheduleToSave?.id !== this._schedule?.id) {
          console.warn('--->>> Not this schedule')
          return
        }
  
  
        console.warn('--->>> saveScheduling$  save request')
        console.error(scheduleToSave)
  
        if (scheduleToSave)
          this.save()
  
      })
    }
    */


  deleteScheduling(scheduling, idx) {

    // this._schedule.planning.splice(idx, 1)
    // this.changes.deleteId(scheduling.id)

    this.changes.delete(scheduling)
  }

  cancelAddScheduling() {
    this.mode = FormMode.editall
  }


  addScheduling() {

    if (!this._schedule.planning)
      this._schedule.planning = []

    const start = this.rangeSelection[0]

    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()))
    this.new.start = DateHelper.yyyyMMdd000000(startDate)



    const end = this.rangeSelection[1]
    const endDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59))
    this.new.end = DateHelper.yyyyMMdd000000(endDate)

    this.new.branchId = this.sessionSvc.branchId
    // this.new.resource = new ConnectTo(this._schedule.resourceId)
    // this.new.schedule = new ConnectTo(this._schedule.id)


    console.error(this.new.startUtc)
    console.error(this.new)

    this._schedule.planning.push(this.new)

    this.changes.createId(this.new.id)

    this.mode = FormMode.editall
    this.initNew()

  }

  initNew() {

    this.new = new ResourcePlanning()

    this.new.resourceId = this._schedule.resourceId
    this.new.scheduleId = this._schedule.id
    this.new.type = PlanningType.sch

  }

  rangePickerChanged(event: any) {

    console.error(event)

  }
  /*
    createDemoScheduling() {
  
      const scheduling1 = new Scheduling()
  
      scheduling1.resourceId = this._schedule.resourceId
      scheduling1.schedId = this._schedule.id
  
      scheduling1.start = new Date(2023, 0, 1)
      scheduling1.end = new Date(2023, 0, 31)
  
      DateHelper.
  
  
      this._schedule.scheduling.push(scheduling1)
      this.changes.createId(scheduling1.id)
  
      const scheduling2 = new Scheduling()
  
      scheduling2.resourceId = this._schedule.resourceId
      scheduling2.schedId = this._schedule.id
      scheduling2.start = new Date(2023, 2, 1)
      scheduling2.end = new Date(2023, 2, 31)
  
      this._schedule.scheduling.push(scheduling2)
      this.changes.createId(scheduling2.id)
  
    }
  */

  async save() {

    console.error("Saving scheduling ................ =================================")

    if (!this.changes?.hasChanges())
      return

    const batch = this.changes?.getApiBatch()

    console.warn(batch)

    const res = await this.planningSvc.batchProcess$(batch)

    if (res.status == ApiStatus.ok) {

      this.dashboardSvc.showToastType(ToastType.saveSuccess)
      //await this.resourceSvc.refreshCachedObjectFromBackend(this.resource.id)
      this.mode = FormMode.editall
      this.changes?.reset()
    } else {

    }

    console.error(res)





  }


  update(scheduling: any) {

    if (scheduling) {
      this.changes.updateId(scheduling.id)
    }

  }


  startAdd() {
    console.warn('Start add..')
    this.mode = FormMode.add

  }

}
