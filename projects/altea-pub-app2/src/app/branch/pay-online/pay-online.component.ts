import { Component, OnDestroy, OnInit } from '@angular/core';
//import Stripe from 'stripe';
import { ActivatedRoute, Router } from '@angular/router';
import { DemoOrdersComponent, GiftService, OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { CreateCheckoutSession, PaymentType } from 'ts-altea-model';
import { TranslationService } from 'ng-common'
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { NgxSpinnerService } from "ngx-spinner"
import { ArrayHelper } from 'ts-common';

/*

https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=embedded-checkout

import Stripe from 'stripe';
const stripe = new Stripe('sk_test_DFr3nlEXpSATg1nltMs3kvbT');



http://localhost:4350/branch/aqua/orderMode/demo-orders


http://localhost:4350/branch/aqua/orderMode/pay-online




*/

export class PaymentOption {
  amount: number

  type: 'deposit' | 'full'

  /** Call To Action */
  cta: string

  info: string

  constructor(amount: number, type: 'deposit' | 'full', cta?: string, info?: string) {

    this.amount = amount
    this.type = type
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

  // in order to pay with gifts
  giftCode: string

  giftMessage = ''


  mode: 'SelectOption' | 'PayMethod' | 'PayOnline' = 'SelectOption'

  payOptions: PaymentOption[] = []

  // Selected payment option
  payOption: PaymentOption
  toPay = 0

  checkout

  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected sessionSvc: SessionService,
    protected stripeSvc: StripeService, private translationSvc: TranslationService, protected authSvc: AuthService, protected spinner: NgxSpinnerService,
    protected giftSvc: GiftService, protected router: Router
  ) {
  }

  async ngOnInit() {


    console.log(this.orderMgrSvc.order)


    await this.setPaymentOptions()

    // for easy dubugging (auto select first option, go to pay type)
    await this.selectPayOption(this.payOptions[0])
    // this.startPayment()

    //  await this.debug()

  }




  /**
   * 
   * @param giftCode Try to pay with gift
   */
  async tryPayGift(giftCode: string) {
    this.giftMessage = ''

    const gifts = await this.giftSvc.searchGift(giftCode)

    if (ArrayHelper.IsEmpty(gifts)) {

      this.giftMessage = `Cadeaubon '${giftCode}' niet gevonden`

    } else {

      const gift = gifts[0]

      const available = gift.availableAmount()

      if (available > 0) {
        const takeFromGift = Math.min(available, this.toPay)
        const remaining = available - takeFromGift

        this.giftMessage = `€${takeFromGift} van cadeaubon '${giftCode}' genomen. De cadeaubon bevat nog €${remaining}.`


        const pay = this.orderMgrSvc.addPayment(takeFromGift, PaymentType.gift, 'app')
        pay.giftId = gift.id

        this.calculateToPay()

        // nothing left to pay
        if (this.toPay == 0) {

          const savedOrder = this.orderMgrSvc.saveOrder()
          console.log(savedOrder)


          this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'order-finished']) //])

        }


      } else {
        // show message to user
        this.giftMessage = `Cadeaubon '${giftCode}' heeft geen beschikbare waarde meer`
      }


    }


  }


  async setPaymentOptions() {

    this.payOptions = []

    const order = this.orderMgrSvc.order
    var deposit = order.deposit

    if (deposit && deposit > 0) {
      const depositPayOption = new PaymentOption(deposit, 'deposit', `Voorschot: €${deposit}`)
      this.payOptions.push(depositPayOption)
    }

    if (order.incl && order.incl > deposit) {
      const fullPayOption = new PaymentOption(order.incl, 'full', `Volledig: €${order.incl}`)
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

  calculateToPay(): number {
    this.toPay = this.payOption.amount
    const paid = this.orderMgrSvc.order.paid
    this.toPay = Math.max(this.toPay - paid, 0)

    return this.toPay
  }

  async selectPayOption(payOption: PaymentOption) {

    if (!payOption)
      return

    this.payOption = payOption

    this.calculateToPay()

    this.mode = 'PayMethod'
    /*
    this.mode = 'PayOnline'
    await this.startPayment(payOption.amount)
*/
  }

  async payOnline() {

    const toPay = this.calculateToPay()


    await this.startPayment(toPay)
  }

  async ngOnDestroy() {

    this.checkout?.destroy()

  }

  async startPayment(amount: number) {

    this.mode = 'PayOnline'

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
