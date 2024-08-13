import { Component, OnInit } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { BotService, LocalService } from 'ng-altea-common';
import { Action, ActionType, Event, LuxomAddress, LuxomState, LuxomGetState, Job, DialogflowWebhookRequest } from 'ts-altea-model';
import { ArrayHelper, DateHelper } from 'ts-common';
import { DashboardService, ToastType } from 'ng-common'

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss']
})
export class JobsComponent {

  date = new Date() //20240808

  events: Event[]
  event: Event

  jobs: Job[]
  job: Job

  //actions: Action[]




  constructor(protected localSvc: LocalService, public dashboardSvc: DashboardService, public  botSvc: BotService) {

  }

  dateNum() {
    return DateHelper.yyyyMMdd(this.date)
  }

  async ngOnInit(): Promise<void> {

    await this.loadEvents()

  }

  
  async dialogflowWebhook() {

    const request = DialogflowWebhookRequest.getDemo()

    console.warn(request)

    const response = await this.botSvc.dialogflowWebhook$(request)
    console.warn(response)
    
  }

  async loadEvents(onDate: Date = new Date()) {

    /*
    

    if (onDate)
      dateNum = 
*/
    let dateNum = DateHelper.yyyyMMdd(onDate)


    this.events = await this.localSvc.getEvents$(dateNum)

    console.error(this.events)
  }

  dateChanged(newDate: Date) {

    this.loadEvents(newDate)
  }

  async deleteEvents(): Promise<any> {
    console.log('delete events')
    const res = await this.localSvc.deleteAllEvents$()
    console.error(res)
  }


  async getJobs(eventId: string): Promise<Job[]> {

    const jobs = await this.localSvc.getJobsForEvent$(eventId)

    console.error(jobs)

    return jobs
  }

  async toggleEvent(event: Event) {

    if (this.event && this.event.id == event.id) {
      this.event = undefined
      this.jobs = undefined
      this.job = undefined
      //this.actions = undefined
      return
    }

    this.event = event
    this.jobs = await this.getJobs(event.id)

    if (ArrayHelper.NotEmpty(this.jobs)) {
      this.toggleJob(this.jobs[0])
    } else {
      this.job = undefined
      //this.actions = undefined
    }

  }



  toggleJob(job: Job) {

    this.job = job


  }

  async runWellness() {

    const result = await this.localSvc.runWellness$()

    console.warn(result)

  }

  async runDoorEntry() {

    const result = await this.localSvc.runDoorEntry$()

    console.warn(result)

  }

  async executeAction(action: Action, job: Job) {

    const res = await this.localSvc.executeAction$(action)

    if (res.isOk)
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    else {
      this.dashboardSvc.showToastType(ToastType.saveError)
    }

    console.log(res)

  }


}
