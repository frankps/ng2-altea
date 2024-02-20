import { Component, EventEmitter, OnInit, inject, Output } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { SessionService, TaskService } from 'ng-altea-common';
import { DbQuery, QueryOperator } from 'ts-common';
import { Task, TaskSchedule, TaskStatus } from 'ts-altea-model';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData } from '@angular/fire/firestore';


@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  private firestore: Firestore = inject(Firestore)

  @Output() select: EventEmitter<Task> = new EventEmitter<Task>()

  resourceIds: string[]

  tasks: Task[]

  selectedId?: string

  constructor(protected authSvc: AuthService, protected taskSvc: TaskService, protected sessionSvc: SessionService) {
    let userId = this.authSvc.user?.id
  }

  async ngOnInit() {

    this.resourceIds = this.authSvc.resourceIds
    console.log(this.resourceIds)

    await this.getTasks()

    let i = 0

    const taskDocRef = doc(this.firestore, 'branches', this.sessionSvc.branchUnique, 'updates', 'task')
    const taskDocData$ = docData(taskDocRef)

    taskDocData$.subscribe(async tasksChanged => {

      console.warn(`Tasks changed!! ${i}`)

      if (i > 0)
        await this.getTasks()

      i++
    })


  }


  async getTasks() {

    const query = new DbQuery()
    query.and('hrIds', QueryOperator.hasSome, this.resourceIds)
    query.and('schedule', QueryOperator.equals, TaskSchedule.once)
    query.and('status', QueryOperator.equals, TaskStatus.todo)

    this.tasks = await this.taskSvc.query$(query)

    console.warn(this.tasks)


  }

  selectTask(task: Task) {

    this.selectedId = task.id
    this.select.emit(task)

  }

  closeTask(task: Task) {

    console.warn('close task')

    this.selectedId = 'abc'
  }
}
