import { BranchService, CustomJsonService, SessionService } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from './auth/auth.service';
import { SwPush } from '@angular/service-worker';
import { AppMode, CustomJson } from 'ts-altea-model';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'altea-pub-app 2'
  //firestore: Firestore = inject(Firestore);


  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService,
    protected authSvc: AuthService, private customJsonSvc: CustomJsonService, private router: Router) {
    this.localeService.use('nl-be');

    this.sessionSvc.appMode = AppMode.consum

    this.authSvc.init()

    this.branchSvc.get(this.sessionSvc.branchId).subscribe(branch => {

      this.sessionSvc.branch = branch

      console.error(branch)

    })


    
  }

  async ngOnInit() {

    this.sessionSvc.branch = await this.branchSvc.get$(this.sessionSvc.branchId)
    console.error(this.sessionSvc.branch)
  }

  

}
