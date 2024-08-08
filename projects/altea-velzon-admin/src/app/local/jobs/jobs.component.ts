import { Component, OnInit } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { LocalService } from 'ng-altea-common';
import { Action, ActionType, Event, LuxomAddress, LuxomState, LuxomGetState, Job } from 'ts-altea-model';
import { ArrayHelper, DateHelper } from 'ts-common';

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




  constructor(protected localSvc: LocalService) {

  }

  dateNum() {
    return DateHelper.yyyyMMdd(this.date)
  }

  async ngOnInit(): Promise<void> {

    await this.loadEvents()

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

}
