import { Component, OnInit, inject } from '@angular/core';
import { ContactService, SessionService } from 'ng-altea-common';
import { Branch, User } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService } from 'ng-altea-common';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, signOut } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {
  auth: Auth = inject(Auth)

  branch: Branch

  constructor(protected sessionSvc: SessionService, protected router: Router, protected route: ActivatedRoute,
    protected orderMgrSvc: OrderMgrUiService, protected authSvc: AuthService, protected contactSvc: ContactService) {

  }


  async ngOnInit() {

    this.branch = await this.sessionSvc.branch$()

    console.error(this.branch)

    this.route.params.subscribe(async params => {
      if (params && params['branch']) {
        const branchUniqueName = params['branch']
        console.warn('New branch', branchUniqueName)


        if (this.authSvc.loggedOn()) {

          

          await this.linkUserToBranchContact(this.branch, this.authSvc.user)



        }




      }
    })
  }


  async linkUserToBranchContact(branch: Branch, user: User) {

    const contact = await this.contactSvc.getContactForUserInBranch(user.id, branch.id)

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


