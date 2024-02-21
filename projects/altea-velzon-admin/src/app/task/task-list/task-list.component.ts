import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, ResourceTypeIcons, Resource, ResourceType, Task, TaskSchedule, TaskStatus } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { ProductService, ResourceService, SessionService, TaskService } from 'ng-altea-common'
import { Observable, take, takeUntil } from 'rxjs';
import { NgBaseComponent, DashboardService, TranslationService, BackendHttpServiceBase, NgBaseListComponent } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";

@Component({
  selector: 'ngx-altea-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent extends NgBaseListComponent<Task> implements OnInit, OnDestroy {

  css_cls_row = 'mt-3'
  searchFor: Task = new Task()
  taskSchedule: Translation[] = []
  taskStatus: Translation[] = []
  initialized = false

  constructor(objectSvc: TaskService, private translationSvc: TranslationService,
    dashboardSvc: DashboardService,
    private modalService: NgbModal, protected route: ActivatedRoute, router: Router, spinner: NgxSpinnerService, protected sessionSvc: SessionService) {
    super(['name', 'prio', 'schedule', 'loc'], { searchEnabled: true, addEnabled: true, path: 'tasks' }
      , objectSvc, dashboardSvc, spinner, router)

    this.searchFor.schedule = undefined
    this.searchFor.status = undefined
  }

  override ngOnDestroy() {
    super.ngOnDestroy()   // important: close all open subscriptions
  }

  async ngOnInit() {

    super._ngOnInit()

    this.getListObjects()
    await this.translationSvc.translateEnum(TaskSchedule, 'enums.task-schedule.', this.taskSchedule)
    await this.translationSvc.translateEnum(TaskStatus, 'enums.task-status.', this.taskStatus)

    this.initialized = true
  }

  override addNew() {
    console.log('Add task')
    this.router.navigate([this.sessionSvc.branchUnique, 'tasks', 'new'])
  }



  override getInitDbQuery(): DbQuery | null {

    const query = new DbQuery()
    query.and('active', QueryOperator.equals, true)

    if (this.searchFor.schedule)
      query.and('schedule', QueryOperator.equals, this.searchFor.schedule)

    query.take = 100
    query.orderBy('name')

    return query

  }

  override getSearchDbQuery(searchFor?: string): DbQuery | null {
    const query = new DbQuery()

    if (searchFor)
      query.and('name', QueryOperator.contains, searchFor)

    if (this.searchFor.schedule)
      query.and('schedule', QueryOperator.equals, this.searchFor.schedule)

    if (this.searchFor.status)
      query.and('status', QueryOperator.equals, this.searchFor.status)

    query.and('active', QueryOperator.equals, true)

    query.orderBy('loc').orderBy('name')

    return query
  }



}
