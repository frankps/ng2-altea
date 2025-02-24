import { Component, Input, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { Schedule, ScheduleTimeBlock, WeekSchedule } from 'ts-altea-model'
import { SelectedDay } from '../schedule-day/schedule-day.component';
import { EditResourceComponent } from '../edit-resource/edit-resource.component';
import { ScheduleSchedulingComponent } from '../schedule-scheduling/schedule-scheduling.component';
import { DateHelper, NamedId } from 'ts-common';
import { ScheduleService, SessionService } from 'ng-altea-common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchProductComponent } from '../../product/search-product/search-product.component';

@Component({
  selector: 'ngx-altea-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
})
export class ScheduleComponent implements OnInit {

  @ViewChild('schedulingComponent') schedulingComponent: ScheduleSchedulingComponent;


  @ViewChild('searchProductModal') public searchProductModal: SearchProductComponent;
  // weeks: WeekSchedule[] = []
  //days = [1, 2, 3, 4, 5, 6,7]

  selectedDay: SelectedDay

  newBlock: ScheduleTimeBlock = new ScheduleTimeBlock()
  @Input() schedule: Schedule
  @Input() readonly = true

  @Input() parent: EditResourceComponent

  branchSchedules: Schedule[]
  //startDate: Date

  constructor(protected scheduleSvc: ScheduleService, protected sessionSvc: SessionService, protected modalService: NgbModal) {
    //this.schedule.scheduling
    // this.createDemoSchedule1()

    //this.createDemoScheduling()
  }

  async ngOnInit() {
    await this.getBranchSchedules()

  }

  async getBranchSchedules() {

    this.branchSchedules = await this.scheduleSvc.getForBranch$()

    console.warn(this.branchSchedules)

  }

  selectProduct() {
    this.searchProductModal.show()
  }

  addExclusionProduct(prod: any) {

    if (!prod || !prod.id)
      return

    if (!this.schedule.exclProds)
      this.schedule.exclProds = []

    this.schedule.exclProds.push(new NamedId(prod.id, prod.name))

    console.warn(prod)
  }

  removeExclProd(exclProd: NamedId) {
    this.schedule.exclProds = this.schedule.exclProds.filter(p => p.id != exclProd.id)
  }

  set startDate(value: Date) {
    this.schedule.start = DateHelper.yyyyMMdd(value)
    console.warn(this.schedule)
  }

  _startDate: Date
  get startDate() {
    let date = DateHelper.parse(this.schedule.start)

    if (date && this._startDate && date.getTime() == this._startDate.getTime())
      return this._startDate

    this._startDate = date
    return date
  }




  save() {

    console.error("Saving schedule ................ =================================")

    if (this.schedulingComponent)
      this.schedulingComponent.save()
  }




  createDemoSchedule1() {

    const week1 = new WeekSchedule(1)

    this.schedule.weeks.push(week1)

    console.error(week1)

  }

  daySelected(selectedDay: SelectedDay) {
    console.error(selectedDay)

    if (this.readonly)
      return

    this.selectedDay = selectedDay

  }

  addTimeBlock() {

    if (!this.selectedDay)
      return

    this.selectedDay.day.blocks.push(this.newBlock.clone())

    // this.
  }

  deleteBlock(block) {

    if (!this.selectedDay)
      return

    this.selectedDay.day.removeBlock(block)

  }

  close() {
    this.selectedDay = null
  }

  removeWeek(weekArrayIdx: number) {

    this.schedule.weeks.splice(weekArrayIdx, 1)

  }

  addWeek() {

    console.warn('Add week')

    if (!Array.isArray(this.schedule.weeks))
      this.schedule.weeks = []

    const week1 = new WeekSchedule(this.schedule.weeks.length + 1)

    this.schedule.weeks.push(week1)

  }




}
