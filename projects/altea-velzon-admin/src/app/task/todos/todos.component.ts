import { Component } from '@angular/core';
import { TaskService } from 'ng-altea-common';
import { Task, TaskSchedule, TaskStatus } from 'ts-altea-model';
import { ApiStatus, DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'altea-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.scss']
})
export class TodosComponent {

  errorMsg?: string


  todo: Task[]

  TaskStatus = TaskStatus

  constructor(protected taskSvc: TaskService) {

  }

  async ngOnInit() {

    await this.refresh()  

  }

  async refresh() {
    const todoQry = this.getTodoQuery()
    this.todo = await this.taskSvc.query$(todoQry)

    console.error(this.todo)
  }

  getTodoQuery() {
    const query = new DbQuery()

    query.and('status', QueryOperator.in, [TaskStatus.todo])
    query.and('schedule', QueryOperator.equals, TaskSchedule.once)
    query.and('origSched', QueryOperator.equals, TaskSchedule.daily)
    query.take = 5

    query.orderByDesc('prio').orderBy('loc').orderBy('name')

    return query
  }


  async changeStatus(task: Task, newStatus: TaskStatus) {

    console.error('changeStatus', task, newStatus)

    task.status = newStatus

    const update: any = {}
    update['id'] = task.id
    update['status'] = newStatus

    if (newStatus == TaskStatus.progress)
      update['startedAt'] = new Date()

    if (newStatus == TaskStatus.done || newStatus == TaskStatus.skip)
      update['finishedAt'] = new Date()

    /*
    update['hrExecId'] = this.auth.resourceId
    update['userId'] = this.auth.userId

    if (this.auth?.resource) {
      const humanResource = this.auth?.resource
      update['by'] = humanResource.shortOrName()
    }
*/

    const res = await this.taskSvc.update$(update)

    if (res.status == ApiStatus.ok) {
      
      this.errorMsg = ''
      
    } else {
      this.errorMsg = res.message
      console.error(res)
    }

    await this.refresh()
  }

}
