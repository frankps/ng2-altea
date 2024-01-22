
import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { RecurringTask, Resource, ResourceType, TaskPriority, TaskSchedule, TaskStatus } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import { DbQuery, QueryOperator, Translation } from 'ts-common'
import { ResourceService } from '../../resource.service'
import { isThisSecond } from 'date-fns'


@Component({
  selector: 'altea-lib-request-invoice',
  templateUrl: './request-invoice.component.html',
  styleUrls: ['./request-invoice.component.css']
})
export class RequestInvoiceComponent implements OnInit {


	recurTask: RecurringTask= new RecurringTask()
	css_cls_row= 'mt-3'
	initialized= false
	@ViewChild('recurringTaskForm')
	recurringTaskForm: NgForm
	taskSchedule: Translation[]= []
  taskPriority: Translation[]= []

	@Output()
	change: EventEmitter<RecurringTask>= new EventEmitter<RecurringTask>()

  resources: Resource[] = []


	constructor(protected translationSvc: TranslationService, protected resourceSvc: ResourceService) {

    
	}

	async ngOnInit() {

		await this.translationSvc.translateEnum(TaskSchedule, 'enums.task-schedule.', this.taskSchedule)
    console.warn('taskPriority')

    await this.translationSvc.translateEnum(TaskPriority, 'enums.task-priority.', this.taskPriority, true)
    await this.loadResources()  

/*     this.taskPriority.push(new Translation(0, "Nul"))
    this.taskPriority.push(new Translation(1, "Eén")) */

		this.initialized = true

    console.error(this.recurTask)

    console.log(TaskStatus)
    console.log(TaskPriority)

	}

  async loadResources() {
    const query = new DbQuery()

    query.and('type', QueryOperator.equals, ResourceType.human)

    this.resources = await this.resourceSvc.query$(query)
  }


	save(recurTask) {
		console.warn("Button 'search' clicked: 'save' method triggered!")
		console.warn(this.recurTask)
		this.change.emit(this.recurTask)
	}  


}
