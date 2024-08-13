import { BranchService, CustomJsonService, SessionService } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from './auth/auth.service';
import { SwPush } from '@angular/service-worker';
import { CustomJson } from 'ts-altea-model';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'altea-pub-app'
  //firestore: Firestore = inject(Firestore);

  readonly VAPID_PUBLIC_KEY = "BAerWF47sf38F0pwPyBSGzrL5sufyBAHY_Ol9ThbZubqfDewAfghj7SsOA26GEMmJ-IB7LIa0fE68sE0nZvAfbQ";

  webPushSubscribed = false


  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService,
    protected authSvc: AuthService, private swPush: SwPush, private customJsonSvc: CustomJsonService, private router: Router) {
    this.localeService.use('nl-be');

    this.authSvc.init()

    /*
    this.branchSvc.get(this.sessionSvc.branchId).subscribe(branch => {

      this.sessionSvc.branch = branch

      console.error(branch)

    })
*/

    
  }

  async ngOnInit() {

    this.sessionSvc.branch = await this.branchSvc.get$(this.sessionSvc.branchId)
    console.error(this.sessionSvc.branch)

    const res = localStorage.getItem('web-push-subscr')

    if (res)
      this.webPushSubscribed = true

  }

  async signOut() {
    this.authSvc.logout()

    await this.router.navigate(['/auth/sign-in']);   // , { queryParams: { returnUrl: this.router.url } }


  }


  async subscribeToNotifications() {



    // https://blog.angular-university.io/angular-push-notifications/

    let me = this


    this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY
    })
      .then(async sub => {
        let customJson = new CustomJson()

        customJson.objId = me.authSvc.userId
        customJson.type = 'user'
        customJson.label = 'web-push-subscr'
        customJson.json = sub

        console.warn(customJson)

        const res = await this.customJsonSvc.create$(customJson)
        console.warn(res)

        this.webPushSubscribed = true

        // remember that we already subscribed
        localStorage.setItem('web-push-subscr', me.authSvc.userId)

      })   // this.newsletterService.addPushSubscriber(sub).subscribe()
      .catch(err => console.error("Could not subscribe to notifications", err));
  }


}
