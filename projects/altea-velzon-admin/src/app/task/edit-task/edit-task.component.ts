
import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Task, Resource, ResourceType, TaskPriority, TaskSchedule, TaskStatus, AvailabilityRequest, Order, OrderLine, ResourceAvailability2, ResourceAvailabilitySets } from 'ts-altea-model'
import { DashboardService, NgEditBaseComponent, TranslationService } from 'ng-common'
import { DbQuery, ObjectHelper, QueryOperator, Translation } from 'ts-common'
import { AlteaService, ObjectService, ProductService, ResourceService, SessionService, TaskService } from 'ng-altea-common'
import { ActivatedRoute, Router } from '@angular/router';
import { NgxModalComponent, DeleteModalComponent } from 'ng-common';
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReplaySubject, take } from 'rxjs';
import { AlteaDb, AvailabilityService, TaskSchedulingService } from 'ts-altea-logic'
import * as dateFns from 'date-fns'
import { CreateAvailabilityContext } from 'projects/ts-altea-logic/src/lib/order/reservation/create-availability-context'

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
  taskStatus: Translation[] = []

  @Output()
  change: EventEmitter<Task> = new EventEmitter<Task>()

  resources: Resource[] = []

  hrNames: string

  deleteConfig = {
    successUrl: '',
    successUrlMobile: ''
    // get successUrl() { return '/aqua/resources' + }
  }


  guid = ObjectHelper.newSmallGuid()

  /* 	constructor(protected translationSvc: TranslationService, protected resourceSvc: ResourceService) {
  
      
    } */

  constructor(protected taskSvc: TaskService, protected resourceSvc: ResourceService, protected productSvc: ProductService, protected translationSvc: TranslationService, route: ActivatedRoute, router: Router,
    spinner: NgxSpinnerService, private modalService: NgbModal, dashboardSvc: DashboardService, protected sessionSvc: SessionService, protected backEndSvc: ObjectService) {
    super('task', Task, ''
      , taskSvc
      , router, route, spinner, dashboardSvc)

    this.sectionProps.set('general', ['name', 'loc', 'info', 'prio', 'date', 'time', 'hrIds', 'schedule', 'cmt', 'status', 'dur'])


  }

  gotoOther() {
    this.router.navigate(['../4678e36c-a0c5-4a86-837c-764c099bc5b2'], {relativeTo: this.route});
    // this.router.navigateByUrl('../4678e36c-a0c5-4a86-837c-764c099bc5b2')
  }

  override async ngOnInit() {
  
    super.ngOnInit()
    await this.translationSvc.translateEnum(TaskSchedule, 'enums.task-schedule.', this.taskSchedule)
    console.warn('taskPriority')

    await this.translationSvc.translateEnum(TaskPriority, 'enums.task-priority.', this.taskPriority, true)

    await this.translationSvc.translateEnum(TaskStatus, 'enums.task-status.', this.taskStatus)

    this.resources = await this.resourceSvc.getHumanResourcesInclGroups()

    /*     this.taskPriority.push(new Translation(0, "Nul"))
        this.taskPriority.push(new Translation(1, "Eén")) */

    this.initialized = true
    this.initializedSubj.next(true)

    console.error(this.recurTask)

    console.log(TaskStatus)
    console.log(TaskPriority)

    await this.getResourceAvailability()
  }


  availSets: ResourceAvailabilitySets[] = null

  async getResourceAvailability() {

    let branch = await this.sessionSvc.branch$()

    let order = new Order()
    order.branch = branch
    order.branchId = this.sessionSvc.branchId

    let product = await this.productSvc.get$('51d89ac4-0ede-49ab-835f-2a3dda81bd70')

    let orderLine = new OrderLine(product, 1)
    order.addLine(orderLine)

    console.log(order)

    let startDate = dateFns.addDays(new Date(), 1)

    order.startDate = startDate

    let availabilityRequest = new AvailabilityRequest(order)

    let alteaDb = new AlteaDb(this.backEndSvc)

    const createAvailabilityContext = new CreateAvailabilityContext(alteaDb)
    const availabilityCtx = await createAvailabilityContext.create(availabilityRequest)

    const availability2 = new ResourceAvailability2(availabilityCtx)
   

    console.error(availability2)

    let availSets = []

    let staffMembers = availabilityCtx.getHumanResources()

    for (let staff of staffMembers) {

      let av = availability2.availability.get(staff.id)
      availSets.push(av)

    }


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


/*   async loadResources() {
    const query = new DbQuery()

    query.and('type', QueryOperator.equals, ResourceType.human)

    this.resources = await this.resourceSvc.query$(query)
  } */

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
