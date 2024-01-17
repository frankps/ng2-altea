import { Component, OnInit } from '@angular/core';
//import Stripe from 'stripe';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { CreateCheckoutSession } from 'ts-altea-model';
import { TranslationService } from 'ng-common'
/*
https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=embedded-checkout

import Stripe from 'stripe';
const stripe = new Stripe('sk_test_DFr3nlEXpSATg1nltMs3kvbT');



*/

declare var Stripe;

@Component({
  selector: 'app-pay-online',
  templateUrl: './pay-online.component.html',
  styleUrls: ['./pay-online.component.scss']
})
export class PayOnlineComponent implements OnInit {


  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected sessionSvc: SessionService, protected stripeSvc: StripeService,
    private translationSvc: TranslationService
    ) {
  }

  async ngOnInit() {

    this.startPayment()

    

  }

  async startPayment() {

    console.warn('startPayment...')

    const stripe : any = new Stripe('pk_test_lTy1ovFLMXISWhS20E268osc');
    const branch = await this.sessionSvc.branch$()
  

    let userInfo = await this.translationSvc.getTrans('app.stripe.gift')


    const createCheckout = CreateCheckoutSession.embedded(99 * 100, branch.cur, userInfo, 'http://localhost:4300/branch/aqua')
    const apiResult = await this.stripeSvc.createCheckoutSession$(createCheckout)
    
    console.error(apiResult)
  
    const clientSecret = apiResult.object.clientSecret
  
    
    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret,
    });
  
    // Mount Checkout
    checkout.mount('#checkout');

  }






}
