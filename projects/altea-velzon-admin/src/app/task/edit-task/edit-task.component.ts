
import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Task, Resource, ResourceType, TaskPriority, TaskSchedule, TaskStatus } from 'ts-altea-model'
import { DashboardService, NgEditBaseComponent, TranslationService } from 'ng-common'
import { DbQuery, QueryOperator, Translation } from 'ts-common'
import { AlteaService, ObjectService, ResourceService, SessionService, TaskService } from 'ng-altea-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReplaySubject, take } from 'rxjs';
import { AlteaDb, TaskSchedulingService } from 'ts-altea-logic'

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent extends NgEditBaseComponent<Task> {

  @ViewChild('deleteModal') public deleteModal: DeleteModalComponent;

  recurTask: Task = new Task()
  css_cls_row = 'mt-3'

  initialized = false
  initializedSubj = new ReplaySubject(1);

  @ViewChild('recurringTaskForm')
  recurringTaskForm: NgForm
  taskSchedule: Translation[] = []
  taskPriority: Translation[] = []

  @Output()
  change: EventEmitter<Task> = new EventEmitter<Task>()

  resources: Resource[] = []

  hrNames: string

  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
    // get successUrl() { return '/aqua/resources' + }
  }

  /* 	constructor(protected translationSvc: TranslationService, protected resourceSvc: ResourceService) {
  
      
    } */

  constructor(protected taskSvc: TaskService, protected resourceSvc: ResourceService, protected translationSvc: TranslationService, route: ActivatedRoute, protected router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService, protected sessionSvc: SessionService, protected backEndSvc: ObjectService) {
    super('task', Task, ''
      , taskSvc
      , route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['name', 'loc', 'info', 'prio', 'date', 'time', 'hrIds', 'schedule', 'cmt'])


  }

  override async ngOnInit() {

    super.ngOnInit()
    await this.translationSvc.translateEnum(TaskSchedule, 'enums.task-schedule.', this.taskSchedule)
    console.warn('taskPriority')

    await this.translationSvc.translateEnum(TaskPriority, 'enums.task-priority.', this.taskPriority, true)
    await this.loadResources()

    /*     this.taskPriority.push(new Translation(0, "Nul"))
        this.taskPriority.push(new Translation(1, "Eén")) */

    this.initialized = true
    this.initializedSubj.next(true)

    console.error(this.recurTask)

    console.log(TaskStatus)
    console.log(TaskPriority)

  }

  initialized$(): Promise<boolean> {

    const me = this

    return new Promise<any>(function (resolve, reject) {

      me.initializedSubj.pipe(take(1)).subscribe(initialized => {
        resolve(initialized)
      })
    })

  }


  showResources(task: Task) {

    if (!task) {

      return
    }

    if (Array.isArray(task.hrIds) && task.hrIds.length > 0)
      this.hrNames = this.resources.filter(r => task.hrIds.indexOf(r.id) >= 0).map(r => r.name).join(', ')
    else
      this.hrNames = ''

  }


  override async initNewObject(object: Task) {

    const branch = await this.sessionSvc.branch$()

    object.branchId = branch.id

  }


  override async objectRetrieved(object: Task): Promise<void> {

    if (!this.object)
      return

    await this.initialized$()

    console.error(object)
    console.error(this.resources)

    this.showResources(this.object)
  }


  async loadResources() {
    const query = new DbQuery()

    query.and('type', QueryOperator.equals, ResourceType.human)

    this.resources = await this.resourceSvc.query$(query)
  }

  startEditSection(sectionId: string, sectionParam: string) {
  }

  save() {

    console.error(this.editSectionId)
    console.error(this.object)

    switch (this.editSectionId) {

      default:
        this.saveSection(this.sectionProps, this.editSectionId)
    }

    this.showResources(this.object)

  }


  scheduleTasks() {

    //let alteaDb = new AlteaDb(this.objectSvc,this.sessionSvc.branchId)

    let svc = new TaskSchedulingService(this.backEndSvc)

    svc.instantiateRecurringTasks()


  }


  delete() {
    console.error('new delete')

    this.deleteConfig.successUrl = '/aqua/tasks/' 
    this.deleteConfig.successUrlMobile = '/aqua/tasks/' 
    this.deleteModal?.delete()
  }

  /*   save(recurTask) {
      console.warn("Button 'search' clicked: 'save' method triggered!")
      console.warn(this.recurTask)
      this.change.emit(this.recurTask)
    }
   */



}
