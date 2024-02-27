import { Component } from '@angular/core';
import { CustomJsonService, ResourceService, SessionService, TaskService } from 'ng-altea-common';
import { Resource, Task, TaskPriority, TaskSchedule, TaskStatus, WebPushToUsers } from 'ts-altea-model';
import { DbQuery, QueryOperator, Translation } from 'ts-common';
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

  initialized = false
  taskPriority: Translation[] = []

  /** if true: a push notification will be sent */
  sendPush: boolean = false


  constructor(protected taskSvc: TaskService, protected resourceSvc: ResourceService, protected translationSvc: TranslationService
    , protected spinner: NgxSpinnerService, public dashboardSvc: DashboardService, protected sessionSvc: SessionService,
    public customJsonSvc: CustomJsonService, protected messagingSvc: MessagingService) {

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

    this.humanResources = await this.resourceSvc.getHumanResources(['children'])
    this.indexHumanResources(this.humanResources)

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

  async saveTask() {

    if (!this.task)
      return


    let error = false

    this.spinner.show()

    try {
      console.error(this.task)

      let result

      switch (this.taskMode) {

        case ManageTaskMode.new:


          // let newTask = this.manualTask.toInstance()
          result = await this.taskSvc.create$(this.task)
          console.warn('New task:', result)
          this.manualTask = undefined

          if (result.isOk) {

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



          result = await this.taskSvc.update$(this.task)
          console.warn('Task updated:', result)
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


  async deleteTask() {

    if (!this.task)
      return

    let error = false

    this.spinner.show()

    try {
      console.error(this.task)

      let result

      switch (this.taskMode) {

        case ManageTaskMode.edit:

          result = await this.taskSvc.delete$(this.task.id)
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
