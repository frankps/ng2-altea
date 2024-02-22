import { Component } from '@angular/core';
import { ResourceService, TaskService } from 'ng-altea-common';
import { Resource, Task, TaskPriority, TaskSchedule, TaskStatus } from 'ts-altea-model';
import { DbQuery, QueryOperator, Translation } from 'ts-common';
import * as dateFns from 'date-fns'
import { th } from 'date-fns/locale';
import { TranslationService } from 'ng-common';

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss']
})
export class TaskDashboardComponent {

  progressDone: Task[]
  todo: Task[]
  manual: Task[]

  newManual: Task

  humanResources: Resource[]

  initialized = false
  taskPriority: Translation[] = []

  constructor(protected taskSvc: TaskService, protected resourceSvc: ResourceService,  protected translationSvc: TranslationService) {

  }


  async ngOnInit() {

    await this.translationSvc.translateEnum(TaskPriority, 'enums.task-priority.', this.taskPriority, true)

    this.humanResources = await this.resourceSvc.getHumanResources()

    this.getTasks()

    this.getManualTasks()

    let i = 0

    this.taskSvc.changeObservable().subscribe(async tasksChanged => {

      console.warn(`Tasks changed!! ${i}`)

      if (i > 0)
        await this.getTasks()

      i++
    })


    this.initialized = true

  }

  addManualTask() {


    if (!this.newManual)
      return

    console.error(this.newManual)

    let newTask = this.newManual.toInstance()

    let res = this.taskSvc.create$(newTask)

    console.warn(res)

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


}
