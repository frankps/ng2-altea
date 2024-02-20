import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { TaskService } from 'ng-altea-common';
import { DbQuery, QueryOperator } from 'ts-common';
import { Task, TaskSchedule } from 'ts-altea-model';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {

  resourceIds: string[]

  tasks: Task[]

  constructor(protected authSvc: AuthService, protected taskSvc: TaskService) {

    let userId = this.authSvc.user?.id


  }

  async ngOnInit() {

    this.resourceIds = this.authSvc.resourceIds
    console.log(this.resourceIds)

    await this.getTasks()

  }


  async getTasks() {

    const query = new DbQuery()
    query.and('hrIds', QueryOperator.hasSome, this.resourceIds)
    query.and('schedule', QueryOperator.equals, TaskSchedule.once)

    this.tasks = await this.taskSvc.query$(query)

    console.warn(this.tasks)


  }

}
