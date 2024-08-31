import { Component, OnDestroy, OnInit } from '@angular/core';
//import Stripe from 'stripe';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { CreateCheckoutSession } from 'ts-altea-model';
import { TranslationService } from 'ng-common'
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { NgxSpinnerService } from "ngx-spinner"

/*

https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=embedded-checkout

import Stripe from 'stripe';
const stripe = new Stripe('sk_test_DFr3nlEXpSATg1nltMs3kvbT');

*/

export class PaymentOption {
  amount: number

  /** Call To Action */
  cta: string

  info: string

  constructor(amount: number, cta?: string, info?: string) {

    this.amount = amount
    this.cta = cta
    this.info = info

  }

}


declare var Stripe;

@Component({
  selector: 'app-pay-online',
  templateUrl: './pay-online.component.html',
  styleUrls: ['./pay-online.component.scss']
})
export class PayOnlineComponent implements OnInit, OnDestroy {

  mode: 'SelectOption' | 'PayOnline' = 'SelectOption'

  payOptions: PaymentOption[] = []

  checkout

  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected sessionSvc: SessionService,
    protected stripeSvc: StripeService, private translationSvc: TranslationService, protected authSvc: AuthService, protected spinner: NgxSpinnerService
  ) {
  }

  async ngOnInit() {

    await this.setPaymentOptions()
    // this.startPayment()

  }


  async setPaymentOptions() {

    this.payOptions = []

    const order = this.orderMgrSvc.order
    var deposit = order.deposit

    if (deposit && deposit > 0) {
      const depositPayOption = new PaymentOption(deposit, `Voorschot: €${deposit}`)
      this.payOptions.push(depositPayOption)
    }

    if (order.incl && order.incl > deposit) {
      const fullPayOption = new PaymentOption(order.incl, `Volledig: €${order.incl}`)
      this.payOptions.push(fullPayOption)
    }


    /** If there is only 1 option, then no need for user to select
     *  We immediatly go to payment
     */
    if (this.payOptions.length == 1) {

      let onlyOption = this.payOptions[0]

      if (onlyOption.amount > 0)
        await this.selectPayOption(onlyOption)

    }

  }

  async selectPayOption(payOption: PaymentOption) {

    if (!payOption)
      return

    this.mode = 'PayOnline'
    await this.startPayment(payOption.amount)

  }



  async ngOnDestroy() {

    this.checkout?.destroy()

  }

  async startPayment(amount: number) {

    let me = this

    console.warn('startPayment...')

    this.spinner.show()


    const stripe: any = new Stripe('pk_test_lTy1ovFLMXISWhS20E268osc');
    const branch = await me.sessionSvc.branch$()

    let userInfo = await me.translationSvc.getTrans('app.stripe.gift')

    const order = me.orderMgrSvc.order

    //    let amount = order.incl

    console.log(me.orderMgrSvc.order)

    let returnUrl = `${environment.app}/branch/${branch.unique}/pay-finished?orderId=${order.id}&sessionId={CHECKOUT_SESSION_ID}`

    const createCheckout = CreateCheckoutSession.embedded(amount * 100, branch.cur, userInfo, returnUrl)
    createCheckout.orderId = order.id

    if (this.authSvc?.user?.email)
      createCheckout.email = this.authSvc.user.email

    console.error(createCheckout)

    const apiResult = await me.stripeSvc.createCheckoutSession$(createCheckout)

    console.error(apiResult)

    const clientSecret = apiResult.object.clientSecret


    me.checkout = await stripe.initEmbeddedCheckout({
      clientSecret,
    });


    // Mount Checkout
    me.checkout.mount('#checkout');


    this.spinner.hide()

  }






}
