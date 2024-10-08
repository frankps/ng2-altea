import { Injectable, OnInit } from '@angular/core';
import { ScheduleService } from './data-services/sql/schedule.service';
import { DbQuery, QueryOperator } from 'ts-common';
import { AppMode, Branch, Contact, Resource } from 'ts-altea-model';
import * as Rx from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnInit {

  formats = {
    date: 'dd/MM/yyyy',
    dateShort: 'dd/MM'
  }  

  colors = {
    green: 'green',
    red: 'red'
  }

  public currency = 'EUR'
  public currencySymbol = ' €'
  public idxStep = 100

  /** location: payment for instance keep track of location = which piece of software performed action  */
  public loc = 'pos'

  public devMode = true
  
  public orgId?: string = "66e77bdb-a5f5-4d3d-99e0-4391bded4c6c"
  public branchUnique = "aqua"
  public branchId?: string = "66e77bdb-a5f5-4d3d-99e0-4391bded4c6c"

  branchSub: Rx.BehaviorSubject<Branch> = new Rx.BehaviorSubject<Branch>(null)
  public _branch?: Branch
  
  public appMode = AppMode.consum

  //public backend = "http://192.168.5.202:8080"
  //public backend = "https://altea-1.ew.r.appspot.com"

  public backend // = "https://dvit-477c9.uc.r.appspot.com"
  //public backend = "http://localhost:8080"

  // public localServer = "http://altea.dvit.local:3000"
  public localServer = "http://localhost:3000"

  /** for internal use (POS): the current user working with the app */
  public humanResource: Resource

  /** for consumer app: the contact matching to the currently logged on user (for current branch) */
  public contact: Contact

  ngOnInit() {

    console.warn('----- SessionService -ee------')

  }

  init(environment: any) {
    this.backend = environment.backend
  }

  get branch(): Branch | undefined {
    return this._branch
  }

  set branch(value: Branch) {
    this._branch = value

    this.branchSub.next(value)
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }  


  async branch$(): Promise<Branch> {
    const me = this

    return new Promise<any>(function (resolve, reject) {
      
      // 
      const sub = me.branchSub.pipe(Rx.filter(branch => branch != undefined && branch !== null)).subscribe(async branch => {

        if (branch) {
          resolve(branch)

          await me.delay(100)  // otherwise the unsubscribe below might not work (sub not yet assigned)

          if (sub)
            sub.unsubscribe()
        }


      })
    })
  }






}
