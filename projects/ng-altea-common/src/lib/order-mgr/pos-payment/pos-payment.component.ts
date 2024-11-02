import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { CompensationGiftReason, Gift, LoyaltyReward, Payment, PaymentType, Subscription, TemplateCode } from 'ts-altea-model';
import { GiftService } from '../../data-services/sql/gift.service';
import { SessionService } from '../../session.service';
import { SubscriptionService } from '../../data-services/sql/subscription.service';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';
import { AlteaService } from '../../altea.service';
import * as _ from "lodash";

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

  compensation: number = 0

  giftCode: string = ''

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

    this.calculateCompensation()
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

  calculateCompensation() {

    let order = this.mgrUiSvc.order

    let compensation = _.round(order.paid - order.incl, 2)

    if (compensation > 0)
      this.compensation = compensation
  }

  async doCompensation() {

    let order = this.mgrUiSvc.order
    let cancelOrderSvc = this.alteaSvc.cancelOrder

    let actions = await cancelOrderSvc.compensateOrder(order, this.compensation, CompensationGiftReason.overpaid, TemplateCode.order_compensate_gift)

    /*
    let pay = Payment.cash(-this.compensation)
    order.addPayment(pay)
*/

    await this.mgrUiSvc.saveOrder()

    console.warn(actions)

  }

  canDoSubscription(): boolean {
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


    console.warn(this.gifts)
  }

  async useGift(gift: Gift) {

    //let amount = gift.availableAmount()

    let amount = gift.availableAmount(this.mgrUiSvc.order.toPay())

    let canUse = gift.canUse(amount)

    console.warn(canUse)

    if (canUse.valid && canUse.amount > 0) {
      const payment = await this.mgrUiSvc.addPayment(canUse.amount, PaymentType.gift, 'pos')

      gift.used += canUse.amount   // for local client: the back-end will do this also when saving the order

      payment.giftId = gift.id
      payment.info = gift.code
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

      /** The back-end will update the subscription when saving the order */
      const payment = await this.mgrUiSvc.addPayment(orderLine.product.salesPrice, PaymentType.subs, 'pos')
      payment.subsId = subs.id

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
