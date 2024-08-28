import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService, OrderUiMode } from 'ng-altea-common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { AuthService } from '../../auth/auth.service';
import { StripeSessionStatus } from 'ts-altea-model';
import { NgxSpinnerService } from "ngx-spinner"


export class PayFinishedParams {
  orderId?: string
  sessionId?: string
}

@Component({
  selector: 'app-pay-finished',
  templateUrl: './pay-finished.component.html',
  styleUrls: ['./pay-finished.component.scss']
})
export class PayFinishedComponent implements OnInit {

  sessionStatus: StripeSessionStatus
  allOk = false

  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected stripeSvc: StripeService, protected authSvc: AuthService, protected spinner: NgxSpinnerService) {

    console.error('PayFinishedComponent')

  }

  async ngOnInit() {


    this.authSvc.redirectEnabled = false

    console.error('ngOnInit')
    console.error(this.orderMgrSvc.order)

    this.route.queryParams.subscribe(async (queryParams: PayFinishedParams) => {

      console.warn(queryParams)

      await this.process(queryParams)
    })

  }


  // http://localhost:4300/branch/aqua/pay-finished?orderId=123&sessionId=cs_test_a19DqbHBympE97ESFCfTiKchDwrJx9YL6ah3ObRTU1Xh1CcJDZDrnICdL6%27


  async process(queryParams: PayFinishedParams) {

    if (!queryParams.sessionId) {
      console.error('Stripe sessionId required!')
      return
    }

    this.spinner.show()

    const res = await this.stripeSvc.sessionStatus(queryParams.sessionId)

    const sessionStatus = res.object
    

    console.error(sessionStatus)

    this.spinner.hide()

    if (sessionStatus) {

      if (sessionStatus.status == 'complete' && sessionStatus.paymentStatus == 'paid') {

        this.allOk = true

      }

      this.sessionStatus = sessionStatus

    }



    console.warn(this.orderMgrSvc.order)

  }



}
