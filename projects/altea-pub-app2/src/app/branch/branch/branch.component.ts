import { Component, OnInit, inject } from '@angular/core';
import { ContactService, SessionService } from 'ng-altea-common';
import { Branch, User } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService } from 'ng-altea-common';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, signOut } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NgxSpinnerService } from "ngx-spinner"

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {
  auth: Auth = inject(Auth)

  branch: Branch

  constructor(protected sessionSvc: SessionService, protected router: Router, protected route: ActivatedRoute,
    protected orderMgrSvc: OrderMgrUiService, protected authSvc: AuthService, protected contactSvc: ContactService,
    protected spinner: NgxSpinnerService) {

  }


  // 'order-finished'

  basketDisabled() {
    let mode = this.orderMgrSvc.mode
    return mode == 'order-finished' || mode == 'summary'
  }

  async ngOnInit() {

    let me = this



    console.error(this.branch)

    this.route.params.subscribe(async params => {
      if (params && params['branch']) {
        const branchUniqueName = params['branch']
        console.warn('New branch', branchUniqueName)



        me.authSvc.user$.subscribe(async user => {

          me.branch = await this.sessionSvc.branch$()

          console.warn('linkUserToBranchContact', user)

          if (user?.id && user.id != me.sessionSvc.contact?.userId) {

            console.warn(`Current user doesn't match session contact`)
            await this.linkUserToBranchContact(me.branch, this.authSvc.user)
          }

        })


        /*
                if (this.authSvc.loggedOn()) {
                  await this.linkUserToBranchContact(this.branch, this.authSvc.user)
                }
        */



      }
    })
  }


  async linkUserToBranchContact(branch: Branch, user: User) {

    this.spinner.show()


    if (!user?.id || !branch?.id)
      return

    const contact = await this.contactSvc.getContactForUserInBranch(user.id, branch.id)

    this.spinner.hide()

    if (contact) {
      this.sessionSvc.contact = contact
      return

    } else {

      // contact not existing => we create
      this.router.navigate(['/branch', 'aqua', 'user-contact'])
    }





  }


  /*
  loggedOn() : boolean {
    
    var loggedOn = this.authSvc.loggedOn()
    console.warn(loggedOn)
    return loggedOn
  }*/

  async appSignOut() {
    await this.authSvc.logout()
    // return signOut(this.auth)
  }

  async gotoProfile() {
    //this.router.navigate(['/auth', 'profile'])
    await this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'profile'])
  }

  appSignIn() {
    this.router.navigate(['/auth', 'sign-in'])
  }

  async gotoBasket() {
    console.warn('gotoBasket')

    // navigate works only when on other page then 'order', therefor we also have changeMode('order')
    await this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])   // , { queryParams: { mode: 'basket' }}
    this.orderMgrSvc.changeUiState('order')
  }

  gotoMenu() {
    console.warn('gotoMenu')
    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'menu'])
  }
}


