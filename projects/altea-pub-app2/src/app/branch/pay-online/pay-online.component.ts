import { Component, OnDestroy, OnInit } from '@angular/core';
//import Stripe from 'stripe';
import { ActivatedRoute, Router } from '@angular/router';
import { DemoOrdersComponent, GiftService, OrderMgrUiService, OrderUiMode, SessionService } from 'ng-altea-common';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { CreateCheckoutSession, OrderState, PaymentType } from 'ts-altea-model';
import { TranslationService } from 'ng-common'
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { NgxSpinnerService } from "ngx-spinner"
import { ArrayHelper } from 'ts-common';
import * as sc from 'stringcase'
/*

https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=embedded-checkout

import Stripe from 'stripe';
const stripe = new Stripe('sk_test_DFr3nlEXpSATg1nltMs3kvbT');



http://localhost:4350/branch/aqua/orderMode/demo-orders


http://localhost:4350/branch/aqua/orderMode/pay-online




*/

export class PaymentOption {
  amount: number

  type: 'deposit' | 'full' | 'balance' | 'confirm'

  /** Call To Action */
  cta: string

  info: string

  constructor(amount: number, type: 'deposit' | 'full' | 'balance' | 'confirm', cta?: string, info?: string) {

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

  voucher: string
  voucherMessage = ''


  mode: 'Init' | 'SelectOption' | 'PayMethod' | 'PayOnline' = 'Init'

  payOptions: PaymentOption[] = []

  // Selected payment option
  payOption: PaymentOption
  toPay = 0

  checkout

  /**
   *  users can NOT use a certain gift code more then once!
   *  --> gifts are only updated in the back-end upon saving the order
   */
  usedGifCodes: string[] = []

  //timerSubscription: Subscription

  constructor(protected orderMgrSvc: OrderMgrUiService, protected route: ActivatedRoute, protected sessionSvc: SessionService,
    protected stripeSvc: StripeService, private translationSvc: TranslationService, protected authSvc: AuthService, protected spinner: NgxSpinnerService,
    protected giftSvc: GiftService, protected router: Router
  ) {
  }

  async ngOnInit() {


    console.log(this.orderMgrSvc.order)


    await this.setPaymentOptions()


/*   
MOVED to order-mgr-ui.service.ts

this.timerSubscription = this.orderMgrSvc.timerChanged.subscribe(seconds => {
      console.log('timer changed', seconds)

      if (seconds == 0) {
        this.sessionTimeout()
      }

    }) */


  }

/*   async sessionTimeout() {
  
    this.orderMgrSvc.clearData()
    await this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'menu'])
  } */


  async ngOnDestroy() {

/*     if (this.timerSubscription) {
      this.timerSubscription.unsubscribe()
    } */

    this.checkout?.destroy()
  }



  /**
   * 
   * @param giftCode Try to pay with gift
   */
  async tryPayGift(giftCode: string) {
    
    let me = this

    if (me.usedGifCodes.indexOf(giftCode) >= 0) {
      this.giftMessage = `Cadeaubon '${giftCode}' reeds gebruikt!`
      return
    }

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

        this.giftCode = ''

        const pay = await this.orderMgrSvc.addPayment(takeFromGift, PaymentType.gift, 'app')
        pay.giftId = gift.id
        pay.info = gift.code

        me.usedGifCodes.push(giftCode)

        this.toPay -= takeFromGift
        //this.calculateToPay()

        // nothing left to pay
        if (this.toPay == 0) {

          const savedOrder = await this.orderMgrSvc.saveOrder(true)
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
    var total = order.incl
    var alreadyPaid = order.paid

    let now = new Date()
    let startDate = order.startDate


    const openDeposit = deposit - alreadyPaid


    if (order.gift && alreadyPaid == 0 && deposit == total) {  

      const fullPayOption = new PaymentOption(total, 'full', `Volledige bedrag betalen €${total}`)
      this.payOptions.push(fullPayOption)
    
    } else {


      if ((!startDate || now < startDate) && deposit && deposit > 0) { // && alreadyPaid < deposit

        if (openDeposit > 0) {
          const depositPayOption = new PaymentOption(openDeposit, 'deposit', `Voorschot betalen €${openDeposit}`)
          this.payOptions.push(depositPayOption)
        } else {
  
          const depositPayOption = new PaymentOption(0, 'confirm', `Confirmeren`)
          this.payOptions.push(depositPayOption)
  
        }
  
      }
  
      if (total && total > deposit && alreadyPaid < total) {
  
        if ((!startDate || now < startDate) && alreadyPaid == 0) {
  
          const fullPayOption = new PaymentOption(total, 'full', `Volledige bedrag betalen €${total}`)
          this.payOptions.push(fullPayOption)
  
        } else {
          const saldo = total - alreadyPaid
  
          const fullPayOption = new PaymentOption(saldo, 'balance', `Saldo betalen van €${saldo}`)
          this.payOptions.push(fullPayOption)
  
        }
  
  
      }


    }




    console.log(this.payOptions)

    /** If there is only 1 option, then no need for user to select
     *  We immediatly go to payment
     */
    if (this.payOptions.length == 1) {

      let onlyOption = this.payOptions[0]

      if (onlyOption.amount > 0) {
        await this.selectPayOption(onlyOption)
        return
      }

    }

    this.mode = 'SelectOption'

  }

  calculateToPay(): number {
    this.toPay = this.payOption.amount

    /*
    const paid = this.orderMgrSvc.order.paid
    this.toPay = Math.max(this.toPay - paid, 0)
*/

    return this.toPay
  }

  async selectPayOption(payOption: PaymentOption) {

    if (!payOption)
      return

    this.payOption = payOption
    this.toPay = payOption.amount

    if (payOption.amount == 0) {
      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'order-finished'])
      return
    }

    //    this.calculateToPay()

    this.mode = 'PayMethod'
    /*
    this.mode = 'PayOnline'
    await this.startPayment(payOption.amount)
*/
  }

  async payOnline() {

    // const toPay = this.calculateToPay()

    /** If timer is not shown, then start it. Normally timer is already activated at moment time slot is selected,
     * but for orders without time (gifts) we need to start it here */
    if (!this.orderMgrSvc.showTimer)
      this.orderMgrSvc.startTimer()

    await this.startPayment(this.toPay)
  }

  async validateVoucher(voucher: string) {
   /* this.voucher = voucher
    this.voucherMessage = ''*/

    const result = this.orderMgrSvc.addVoucher(voucher)

    this.voucherMessage = result.message
  }




  async startPayment(amount: number) {


    // introduced for gift payment
    await this.orderMgrSvc.saveOrder()


    this.mode = 'PayOnline'

    let me = this

    console.warn('startPayment...')

    this.spinner.show()



    const branch = await me.sessionSvc.branch$()

   // let userInfo = await me.translationSvc.getTrans('app.stripe.gift')

    const order = me.orderMgrSvc.order

    //    let amount = order.incl  

    console.log(me.orderMgrSvc.order)



    let returnUrl = `${environment.app}/branch/${branch.unique}/pay-finished?orderId=${order.id}&sessionId={CHECKOUT_SESSION_ID}`

    /** the marketing company requested to add product info */
    let products = order.getProducts()

    if (ArrayHelper.NotEmpty(products)) {
      let numOfProducts = products.length
      
      if (numOfProducts > 0 && products[0].slug) {
        let slug = sc.snakecase(products[0].slug)
        returnUrl += `&prod0=${slug}`
      }
    }

    /*
    prod0
    */

    let stripeShowText = 'Aquasense'

    const stripeEnv = this.sessionSvc.stripEnvironment
    const createCheckout = CreateCheckoutSession.embedded(amount * 100, branch.cur, stripeShowText, returnUrl, stripeEnv)
    createCheckout.orderId = order.id

    if (this.authSvc?.user?.email)
      createCheckout.email = this.authSvc.user.email
    else if (order.email)
      createCheckout.email = order.email

    console.error(createCheckout)

    const apiResult = await me.stripeSvc.createCheckoutSession$(createCheckout)

    console.error(apiResult)

    const createdSession = apiResult.object

    const clientSecret = createdSession.clientSecret
    const publicKey = createdSession.publicKey

   // const stripe: any = new Stripe('pk_test_lTy1ovFLMXISWhS20E268osc');
    const stripe: any = new Stripe(publicKey)

    me.checkout = await stripe.initEmbeddedCheckout({
      clientSecret,
    });

    console.log(me.checkout)


    // Mount Checkout
    me.checkout.mount('#checkout');


/*     
    var res = await me.stripeSvc.sessionStatus(stripeEnv, createdSession.id)

    console.log(res) */
    

    this.spinner.hide()

  }






}
