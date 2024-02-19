import { Component, inject } from '@angular/core';
import { BranchService, SessionService } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from './auth/auth.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'altea-pub-app'

  //firestore: Firestore = inject(Firestore);


  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService, private authSvc: AuthService) {
    this.localeService.use('nl-be');

    this.authSvc.init()

    this.branchSvc.get(this.sessionSvc.branchId).subscribe(branch => {

      this.sessionSvc.branch = branch

      console.error(branch)

    })
  
    
  }


}
