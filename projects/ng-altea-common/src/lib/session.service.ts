import { Injectable, OnInit } from '@angular/core';
import { ScheduleService } from './data-services/sql/schedule.service';
import { ArrayHelper, DbQuery, ObjectHelper, QueryOperator } from 'ts-common';
import { AppMode, Branch, Contact, Payment, Resource, ResourcePlannings } from 'ts-altea-model';
import * as Rx from "rxjs";
// import { LocalService } from 'ng-altea-common';


export class Clipboard {
  payments: Payment[] = []

  hasPayments(): boolean {
    return ArrayHelper.NotEmpty(this.payments)
  }
}

@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnInit {

  formats = {
    date: 'dd/MM/yyyy',
    dateShort: 'dd/MM',
    dateTimeShort: 'dd/MM/yy HH:mm',
  }

  colors = {
    green: 'green',
    red: 'red'
  }

  /** used for cut/paste operations */
  clipboard = new Clipboard()

  // public _role: 'staff' | 'admin' | 'posAdmin' = 'staff'

  public roles: string[] = ['staff']

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

  public localServer = "http://altea.dvit.local:3000"
  //  public localServer = "http://localhost:3000"

  /** for internal use (POS): the current user working with the app */
  public humanResource: Resource

  /** for consumer app: the contact matching to the currently logged on user (for current branch) */
  public contact: Contact

  public stripEnvironment: 'test' | 'live' = 'live'



  public uiState = {
    orderGrid: null
  }

  constructor() {
    let stripeEnv = localStorage.getItem('stripEnvironment')

    if (stripeEnv && (stripeEnv == 'test' || stripeEnv == 'live'))
      this.stripEnvironment = stripeEnv

    // new version, to support more roles
    let roles = localStorage.getItem('roles')

    if (roles)
      this.roles = roles.split('|')
    else
      this.roles = []


  }

  ngOnInit() {
    console.warn('----- SessionService -ee------')


  }

  /**
   * Is POS (Point Of Sales) = is internal usage of app?
   * @returns 
   */
  isPos(): boolean {
    return (this.appMode == AppMode.pos)
  }

  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  isPosAdmin(): boolean {
    return (this.appMode == AppMode.pos && this.hasRole('admin', 'posAdmin'))
  }

  init(environment: any) {
    this.backend = environment.backend
  }

  get stripeTest(): boolean {
    return this.stripEnvironment == 'test'
  }

  set stripeTest(value: boolean) {
    this.stripEnvironment = value ? 'test' : 'live'
    localStorage.setItem('stripEnvironment', this.stripEnvironment)
    console.log(this.stripEnvironment)
  }


  /*
  toggleRolePosAdmin() {
    this.role = this._role == 'staff' ? 'posAdmin' : 'staff'
  }

  toggleRoleAdmin() {
    this.role = this._role == 'staff' ? 'admin' : 'staff'
  }

  get role(): 'staff' | 'admin' | 'posAdmin' {
    return this._role
  }

  set role(value: 'staff' | 'admin' | 'posAdmin') {
    this._role = value
    localStorage.setItem('role', value)
    console.error(`New role: ${value}`)
  }
*/

  // new multi role mechanism

  toggleRole(role: string) {

    let idx = this.roles.indexOf(role)

    if (idx >= 0)
      this.roles.splice(idx, 1)
    else
      this.roles.push(role)

    let str = this.roles.join('|')
    localStorage.setItem('roles', str)
  }

  hasRole(...roles: string[]) {

    // console.log(roles)

    if (ArrayHelper.IsEmpty(roles))
      return false

    for (let role of roles) {
      let idx = this.roles.indexOf(role)
      if (idx >= 0)
        return true
    }

    return false
  }


  private uniqueClientId: string

  clientId(): string {

    if (this.uniqueClientId)
      return this.uniqueClientId

    let clientId = localStorage.getItem('clientId')

    if (clientId) {
      this.uniqueClientId = clientId
    } else {
      this.uniqueClientId = ObjectHelper.newGuid()
      localStorage.setItem('clientId', this.uniqueClientId)
    }

    return this.uniqueClientId
  }


  get branch(): Branch | undefined {
    return this._branch
  }

  set branch(branch: Branch) {
    this._branch = branch

    if (branch) {
      this.branchId = branch.id
      this.branchUnique = branch.unique
      this.orgId = branch.orgId
    } else {
      this.branchId = null
      this.orgId = null
    }

    this.branchSub.next(branch)
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
