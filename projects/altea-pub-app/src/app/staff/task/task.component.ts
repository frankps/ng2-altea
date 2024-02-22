import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskService } from 'ng-altea-common';
import { Task, TaskStatus } from 'ts-altea-model';
import { ApiStatus } from 'ts-common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent {

  TaskStatus = TaskStatus
  @Input() task: Task
  @Output() close: EventEmitter<Task> = new EventEmitter<Task>()

  show = true

  errorMsg?: string

  constructor(protected taskSvc: TaskService, protected auth: AuthService) {
  }

  closeTask(event?: any) {

    if (event)
      event.stopPropagation();

    this.show = false
    this.close.emit(this.task)
  }
  // 11f462c2-838b-4196-9b4d-3b79d7fdf5ae
  async changeStatus(newStatus: TaskStatus) {

    this.task.status = newStatus

    const update: any = {}
    update['id'] = this.task.id
    update['status'] = newStatus

    if (newStatus == TaskStatus.progress)
      update['startedAt'] = new Date()

    if (newStatus == TaskStatus.done || newStatus == TaskStatus.skip)
      update['finishedAt'] = new Date()

    update['hrExecId'] = this.auth.resourceId
    update['userId'] = this.auth.userId

    if (this.auth?.resource) {
      const humanResource = this.auth?.resource
      update['by'] = humanResource.shortOrName()
    }


    const res = await this.taskSvc.update$(update)

    if (res.status == ApiStatus.ok) {
      this.closeTask()
      return
    }

    this.errorMsg = res.message
    console.error(res)
  }

}
