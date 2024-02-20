import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskService } from 'ng-altea-common';
import { Task, TaskStatus } from 'ts-altea-model';
import { ApiStatus } from 'ts-common';

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

  constructor(protected taskSvc: TaskService) {
  }

  closeTask(event?: any) {

    if (event)
      event.stopPropagation();
    
      this.show = false
    this.close.emit(this.task)
  }

  async changeStatus(newStatus: TaskStatus) {

    this.task.status = newStatus

    const update: any = {}
    update['id'] = this.task.id
    update['status'] = newStatus

    const res = await this.taskSvc.update$(update)

    if (res.status == ApiStatus.ok) {
      this.closeTask()
      return
    }
    
    this.errorMsg = res.message
    console.error(res)
  }

}
