import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService, OrderUiMode } from 'ng-altea-common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';

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

  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected stripeSvc: StripeService) {

    console.error('PayFinishedComponent')

  }

  async ngOnInit() {

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

    const sessionStatus = await this.stripeSvc.sessionStatus('test', queryParams.sessionId)

    console.error(sessionStatus)


  }

}
