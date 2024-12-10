import { Component } from '@angular/core';
import { CustomJsonService, OrderService, ResourcePlanningService, ResourceService, SessionService, TaskService } from 'ng-altea-common';
import { PlanningType, Resource, ResourcePlanning, Task, TaskPriority, TaskSchedule, TaskStatus, TimeOfDay, WebPushToUsers } from 'ts-altea-model';
import { ApiBatchProcess, ApiResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, QueryOperator, Translation } from 'ts-common';
import * as dateFns from 'date-fns'
import { th, tr } from 'date-fns/locale';
import { TranslationService } from 'ng-common';
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common'
import { MessagingService } from 'projects/ng-altea-common/src/lib/messaging.service';

enum ManageTaskMode {
  none,
  edit,
  new
}

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss']
})
export class TaskDashboardComponent {

  css_cls_row = 'mt-2'

  progressDone: Task[]
  todo: Task[]
  manual: Task[]

  ManageTaskMode = ManageTaskMode
  taskMode = ManageTaskMode.none
  task: Task
  manualTask: Task  // task selected from dropdown

  humanResources: Resource[]
  humanResourcesById: Map<string, Resource> = new Map<string, Resource>()

  quickResources: Resource[]  // frequently used resources

  initialized = false
  taskPriority: Translation[] = []

  /** if true: a push notification will be sent */
  sendPush: boolean = false


  constructor(protected taskSvc: TaskService, protected resourceSvc: ResourceService, protected translationSvc: TranslationService
    , protected spinner: NgxSpinnerService, public dashboardSvc: DashboardService, protected sessionSvc: SessionService, protected planningSvc: ResourcePlanningService,
    public customJsonSvc: CustomJsonService, protected messagingSvc: MessagingService, protected orderSvc: OrderService) {

  }


  async webPush() {

    const msg = new WebPushToUsers('Aquasense', 'Hallo!!')
    msg.userIds = ['886c48d3-55c6-4436-a6b7-803cd7539f90']

    console.warn(msg)

    const res = await this.messagingSvc.webPushToUsers$(msg)

    console.error(res)

  }


  async ngOnInit() {

    await this.translationSvc.translateEnum(TaskPriority, 'enums.task-priority.', this.taskPriority, true)

    this.humanResources = await this.resourceSvc.getHumanResourcesInclGroups(['children'])
    this.indexHumanResources(this.humanResources)

    let shortNames = ['Lusien', 'Iris', 'Hèra']

    this.quickResources = this.humanResources.filter(hr => shortNames.indexOf(hr.short) >= 0)


    this.getTasks()

    this.getManualTasks()

    let i = 0


    this.taskSvc.changeObservable().subscribe(async tasksChanged => {

      console.warn(`Tasks changed!! ${i}`)

      if (i > 0)
        await this.getTasks()

      i++
    })

    await this.getWebPushData()


    this.initialized = true
  }

  indexHumanResources(resources: Resource[]) {

    this.humanResourcesById.clear()

    if (!Array.isArray(resources))
      return

    resources.forEach(resource => { this.humanResourcesById.set(resource.id, resource) })
  }

  getResourceName(resourceId: string) {

    if (!this.humanResourcesById.has(resourceId))
      return undefined

    return this.humanResourcesById.get(resourceId).shortOrName()

  }

  addResource(resource: Resource) {

    if (ArrayHelper.NotEmpty(this.task.hrIds)) {
      if (this.task.hrIds.indexOf(resource.id) >= 0)
        return

      this.task.hrIds = [...this.task.hrIds, resource.id]
    }
    else
      this.task.hrIds = [resource.id]

  }

  isEdit(): boolean {
    return this.taskMode == ManageTaskMode.edit
  }

  isNewOrEdit(): boolean {
    return (this.taskMode == ManageTaskMode.edit || this.taskMode == ManageTaskMode.new)
  }

  editTask(task: Task) {
    this.task = task
    this.taskMode = ManageTaskMode.edit
  }

  newTaskSelected(task: Task) {

    this.taskMode = ManageTaskMode.new
    this.task = this.manualTask.toInstance()

    console.warn(this.task.id)

    if (task.id == 'empty') {
      this.task.name = ''
      this.task.rTaskId = null
    }

  }

  taskToPlannings(task: Task): ResourcePlanning[] {

    if (!task || ArrayHelper.IsEmpty(task.hrIds))
      return []


    let plannings = []

    for (let hrId of task.hrIds) {

      let resource = this.humanResourcesById.get(hrId)

      if (!resource)
        continue


      let planning = new ResourcePlanning()
      plannings.push(planning)

      planning.taskId = task.id
      planning.branchId = task.branchId

      if (resource.isGroup) {
        planning.resourceGroupId = resource.id
      } else {
        planning.resourceId = resource.id
      }

      planning.taskId = task.id

      let startDate = task.typedDate


      if (task.time) {
        let timeOfDay = TimeOfDay.parse(task.time)

        if (timeOfDay) {
          startDate = dateFns.set(startDate, { hours: timeOfDay.hours, minutes: timeOfDay.minutes })
        }
      }

      planning.start = DateHelper.yyyyMMddhhmmss(startDate)

      //DateHelper.addT addMinutes(startDate, task.dur)


      let duration = task.dur ? task.dur : 0

      let endDate = dateFns.addMinutes(startDate, duration)
      planning.end = DateHelper.yyyyMMddhhmmss(endDate)

      /** if blocking task => must be executed by resource => no overlap allowed with other (new) plannings */
      planning.overlap = !task.block

      planning.type = PlanningType.tsk


    }

    return plannings

  }


  async createPlannings(task: Task) {

    let me = this

    let plannings = this.taskToPlannings(task)

    if (!ArrayHelper.IsEmpty(plannings)) {
      let batch = new ApiBatchProcess<ResourcePlanning>()
      batch.create = plannings
      let resultPlannings = await this.planningSvc.batchProcess$(batch, this.dashboardSvc.resourceId)
      console.warn('ResourcePlanning', resultPlannings)


      if (resultPlannings.status == ApiStatus.ok) {
        task.planning = plannings

        // we still need to push to Firebase
        var res = await me.orderSvc.pushTaskToFirebase(task.id)
        console.warn('push task to firebase', res)

      }
    }
  }


  async saveTask() {

    let me = this

    if (!me.task)
      return

    let task = this.task

    let error = false

    this.spinner.show()

    try {
      console.error(task)

      let result: ApiResult<Task>

      switch (this.taskMode) {

        case ManageTaskMode.new:


          // let newTask = this.manualTask.toInstance()
          result = await this.taskSvc.create$(task, this.dashboardSvc.resourceId)
          console.warn('New task:', result)
          this.manualTask = undefined

          if (result.isOk) {

            task = result.object

            /** check if we need to show taks in calendar */
            if (!task.template && task.plan)
              await this.createPlannings(task)

            if (this.task.template) {
              this.manual.push(this.task)
            }


            if (!this.task.template && this.sendPush) {

              let userIds = this.getUserIdsForTask(this.task)

              if (userIds.length == 0)
                break

              let body = ''
              if (this.task.loc) body = this.task.loc
              if (this.task.info) body += ': ' + this.task.info

              const msg = new WebPushToUsers(this.task.name, body)
              msg.userIds = userIds

              console.warn('web push msg', msg)


              /*               const pushRes = await this.messagingSvc.webPushToUsers$(msg)
                            console.warn('push res:', pushRes)
               */

            }

          }


          break

        case ManageTaskMode.edit:

          // if task is planned => ResourcePlanning must be deleted & order (representing task) in Firebase must be deleted
          if (!task.template && task.plan)
            await this.deletePlannings(task)


          result = await this.taskSvc.update$(this.task, this.dashboardSvc.resourceId)
          console.warn('Task updated:', result)

          /** check if we need to show taks in calendar */
          if (!task.template && task.plan)
            await this.createPlannings(task)


          break

        default:
          console.warn(`Task mode '${this.taskMode}' not supported in saveTask()`)
          break
      }

      if (result) {
        if (result?.isOk) {
          this.dashboardSvc.showToastType(ToastType.saveSuccess)

          this.taskMode = ManageTaskMode.edit  // for new tasks
        } else {
          error = true
        }
      }

    } catch (err) {
      error = true
    }
    finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showToastType(ToastType.saveError)

    }

  }

  getUserIdsForTask(task: Task): string[] {

    if (!task || !Array.isArray(task.hrIds) || task.hrIds.length == 0)
      return []

    let hr = this.humanResources.filter(hr => task.hrIds.indexOf(hr.id) >= 0)
    // hr can contain both contain group and child resources
    // we must replace group resources by their group of child resources

    let childResources: Resource[] = hr.filter(resource => !resource.isGroup)

    let childResourceIds = []

    if (Array.isArray(childResources))
      childResourceIds = childResources.map(res => res.id)

    const groupResources: Resource[] = hr.filter(resource => resource.isGroup)

    if (Array.isArray(groupResources) && groupResources.length >= 0) {
      groupResources.forEach(groupRes => {
        let groupChildIds = groupRes.children.map(link => link.childId)

        if (Array.isArray(groupChildIds))
          childResourceIds.push(...groupChildIds)
      })
    }

    childResources = this.humanResources.filter(hr => childResourceIds.indexOf(hr.id) >= 0)

    const userIds = childResources.filter(hr => hr.userId).map(hr => hr.userId)

    console.error(userIds)

    return userIds
  }

  async deletePlannings(task: Task) {

    let me = this

    let query = new DbQuery()
    query.and('taskId', QueryOperator.equals, task.id)
    query.and('branchId', QueryOperator.equals, task.branchId)

    let delPlannings = await this.planningSvc.deleteMany$(query)
    console.warn('ResourcePlanning deleted:', delPlannings)

    // for calendar purpose: we export a task as order in Firebase (just for UI)
    var delFirebase = await me.orderSvc.deleteOrderInFirebase(task.branchId, task.id)
    console.warn('delete order in firebase', delFirebase)

  }

  async deleteTask() {

    let me = this

    if (!this.task || !this.task.id)
      return

    let task = this.task

    let error = false

    this.spinner.show()

    try {
      console.error(task)

      let result

      switch (this.taskMode) {

        case ManageTaskMode.edit:

          // if task is planned => ResourcePlanning must be deleted & order (representing task) in Firebase must be deleted
          if (!task.template && task.plan)
            await this.deletePlannings(task)

          result = await this.taskSvc.delete$(task.id, this.dashboardSvc.resourceId)
          console.warn('Task deleted:', result)


          break

        default:
          return
      }

      if (result?.isOk) {
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
      } else {
        error = true
      }

    } catch (err) {
      error = true
    }
    finally {


      this.spinner.hide()

      if (error)
        this.dashboardSvc.showToastType(ToastType.saveError)
      else {
        this.taskMode = ManageTaskMode.none
        this.task = undefined
      }

    }

  }

  async getTasks() {

    const progressDoneQry = this.getProgressDoneQuery()
    this.progressDone = await this.taskSvc.query$(progressDoneQry)

    //console.error(this.progressDone)

    const todoQry = this.getTodoQuery()
    this.todo = await this.taskSvc.query$(todoQry)

  }

  async getManualTasks() {
    const manualQry = this.getManualTasksQuery()
    this.manual = await this.taskSvc.query$(manualQry)


    const emptyTask = new Task()
    emptyTask.id = "empty"
    emptyTask.name = 'Lege taak'
    emptyTask.branchId = this.sessionSvc.branchId
    emptyTask.schedule = TaskSchedule.once
    this.manual.push(emptyTask)


  }

  getProgressDoneQuery() {

    const query = new DbQuery()

    const startOfDay = dateFns.startOfDay(new Date())

    //query.include('hrExec')
    query.and('status', QueryOperator.in, [TaskStatus.done, TaskStatus.progress, TaskStatus.skip])
    query.and('schedule', QueryOperator.equals, TaskSchedule.once)

    query.or('finishedAt', QueryOperator.greaterThan, startOfDay)
    query.or('startedAt', QueryOperator.greaterThan, startOfDay)

    query.orderBy('status').orderByDesc('finishedAt').orderByDesc('startedAt')

    return query
  }


  getTodoQuery() {
    const query = new DbQuery()

    query.and('status', QueryOperator.in, [TaskStatus.todo])
    query.and('schedule', QueryOperator.equals, TaskSchedule.once)

    query.orderByDesc('prio').orderBy('loc').orderBy('name')

    return query
  }

  getManualTasksQuery() {
    const query = new DbQuery()

    // query.and('status', QueryOperator.in, [ TaskStatus.todo ])
    query.and('schedule', QueryOperator.equals, TaskSchedule.manual)

    query.orderBy('name')

    return query
  }


  async getWebPushData() {

    let webPushData = await this.customJsonSvc.query$(this.getWebPushSubscriptions())

    console.error(webPushData)

    let webPushUserIds = webPushData.map(customJson => customJson.objId)

    let humanResourcesWithWebPush = this.humanResources.filter(hr => webPushUserIds.indexOf(hr.userId) >= 0)

    console.warn(humanResourcesWithWebPush)
  }


  getWebPushSubscriptions() {
    const query = new DbQuery()

    // query.and('status', QueryOperator.in, [ TaskStatus.todo ])
    query.and('label', QueryOperator.equals, 'web-push-subscr')
    query.and('type', QueryOperator.equals, 'user')

    return query
  }




}
