import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Gift, LoyaltyReward, Payment, PaymentType, Subscription } from 'ts-altea-model';
import { GiftService } from '../../sql-object-svc/gift.service';
import { SessionService } from '../../session.service';
import { SubscriptionService } from '../../sql-object-svc/subscription.service';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';
import { AlteaService } from '../../altea.service';

export enum PosPaymentMessage {
  none = 'none',
  noContact = 'noContact',
  noProduct = 'noProduct',
  noSubscription = 'noSubscription'
}

@Component({
  selector: 'order-mgr-pos-payment',
  templateUrl: './pos-payment.component.html',
  styleUrls: ['./pos-payment.component.scss']
})
export class PosPaymentComponent implements OnInit {

  amount: number

  giftCode: string = 'BB'

  showGifts = false
  gifts: Gift[]

  showSubscriptions = false
  subscriptions: Subscription[]

  PaymentType = PaymentType
  PosPaymentMessage = PosPaymentMessage
  message: PosPaymentMessage = PosPaymentMessage.none

  constructor(protected mgrUiSvc: OrderMgrUiService, protected giftSvc: GiftService, protected sessionSvc: SessionService, 
    protected subSvc: SubscriptionService, protected alteaSvc: AlteaService) {
  }

  async ngOnInit() {
    
    console.warn('ngOnInit')

    await this.getRewards()
  }

  async addPayment(type: PaymentType) {

    switch (type) {

      /** Handle gift */
      case PaymentType.gift:
        await this.startGift()
        break

      /** Handle subscription */
      case PaymentType.subs:
        this.message = await this.startSubscription()
        break

      default:
        this.mgrUiSvc.addPayment(this.amount, type, 'pos')
    }




  }

  canDoSubscription() : boolean {
    let productIds = this.mgrUiSvc.order.getProductIds()

    return (this.mgrUiSvc.order?.contactId && ArrayHelper.AtLeastOneItem(productIds))
  }

  async startSubscription(): Promise<PosPaymentMessage> {

    let contactId = this.mgrUiSvc.order.contactId

    if (!contactId)
      return PosPaymentMessage.noContact


    let productIds = this.mgrUiSvc.order.getProductIds()

    if (ArrayHelper.IsEmpty(productIds))
      return PosPaymentMessage.noContact


    let query = new DbQuery()
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.and('unitProductId', QueryOperator.in, productIds)
    query.and('act', QueryOperator.equals, true)
    query.and('contactId', QueryOperator.equals, contactId)

    /*     if (contactId)
          query.and('contactId', QueryOperator.equals, contactId)
        else
        query.and('contactId', QueryOperator.equals, null) */

    this.subscriptions = await this.subSvc.query$(query)

    if (ArrayHelper.AtLeastOneItem(this.subscriptions)) {
      this.showSubscriptions = true
      
    } else {
      return PosPaymentMessage.noSubscription
    }


    console.warn(this.subscriptions)

    return PosPaymentMessage.none

  }


  async startGift() {

    if (!this.giftCode)
      return

    this.gifts = await this.giftSvc.searchGift(this.giftCode)

    if (this.gifts.length >= 1) {
      this.showGifts = true
    }
    /*
    else if (this.gifts.length == 1) {

      let gift = this.gifts[0]

      this.useGift(gift)
    } */

    console.warn(this.gifts)
  }

  async useGift(gift: Gift) {

    let canUse = gift.canUse(this.amount)

    console.warn(canUse)

    if (canUse.valid && canUse.amount > 0) {
      const payment = this.mgrUiSvc.addPayment(canUse.amount, PaymentType.gift, 'pos')
      payment.giftId = gift.id
      /* 
            let res = await this.mgrUiSvc.testPaymentProcessing()
            console.warn(res) */
    }

  }


  async useSubscription(subs: Subscription) {

    // whatever the current price, we need to pay the product (identified by unitProductId)
    // let product = this.mgrUiSvc.getProduct(subs.unitProductId)  //order.getLineByProduct(subs.unitProductId)

    /*

    */

    let orderLine = this.mgrUiSvc.order.getLineByProduct(subs.unitProductId)

    if (orderLine) {
      // orderLine

      const payment = this.mgrUiSvc.addPayment(orderLine.product.salesPrice, PaymentType.subs, 'pos')
      payment.subsId = subs.id
      /* 
            let res = await this.mgrUiSvc.testPaymentProcessing()
            console.warn(res) */
    }

  }



  get totalToPay(): number {

    if (!this.mgrUiSvc.order)
      return 0

    return this.mgrUiSvc.order.incl - this.mgrUiSvc.order.paid
  }

  setAmountTotal() {
    this.amount = this.totalToPay
  }


  async getRewards() {

    const order = this.mgrUiSvc.order

    if (!order)
      return  

    const loyalty = await this.alteaSvc.loyaltyMgmtService.getOverview(order)

    const rewards = loyalty.availableRewards()

    console.error('REWARDS', rewards)
  }

  /*
  rewards: LoyaltyReward[] = []

  availableRewards() {

    const order = this.mgrUiSvc.order

    const cards = order.contact.cards

    for (let card of cards) {

      const program = card.program

      program.rewards.filter(r => )
    }


  }
  */

}
