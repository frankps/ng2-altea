import { Component, OnInit, inject } from '@angular/core';
import { SessionService } from 'ng-altea-common';
import { Branch } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService } from 'ng-altea-common';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, signOut } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {
  auth: Auth = inject(Auth);

  branch: Branch

  constructor(protected sessionSvc: SessionService, protected router: Router,  protected orderMgrSvc: OrderMgrUiService, protected authSvc: AuthService) {

  }


 async ngOnInit() {

   this.branch = await this.sessionSvc.branch$()
    


  }

  appSignOut() {
    return signOut(this.auth)
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


