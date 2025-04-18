import { Component, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { CompensationGiftReason, Gift, LoyaltyReward, OrderLine, Payment, PaymentType, ProductItemOptionMode, Subscription, TemplateCode } from 'ts-altea-model';
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

    // subscriptionProduct
    query.include('subscriptionProduct.items')
    //    query.include('unitProduct.items')

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

    let toPay = this.mgrUiSvc.order.toPay()

    let amount = gift.availableAmount(toPay)

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


  canUseSubscription(orderLine: OrderLine, subs: Subscription): boolean {

    let openQty = subs.openQty()

    if (openQty <= 0)
      return false

    if (orderLine.productId != subs.unitProductId)
      return false

    /* Most subscriptions just have 1 item */
    for (let prodItem of subs.subscriptionProduct.items) {

      if (!prodItem.hasOptions())
        continue

      for (let option of prodItem.options) {

        switch (option.mode) {
          case ProductItemOptionMode.cust:

            /** Custom subscription. The customer can choose option values themselves: the selected option values are stored in Subscription.options
               *  => the orderline needs to have at least these options selected. (if other options with price are selected in orderline)
                */
            let subscriptionValueIds = subs.getOptionValueIds(option.id)
            let orderLineValueIds = orderLine.getOptionValueIds(option.id)

            let commonValueIds = _.intersection(subscriptionValueIds, orderLineValueIds)

            if (commonValueIds.length < subscriptionValueIds.length) {

              let msg = `Not all values from subscription are selected in orderline!`
              console.warn(msg)
              return false

            }

            break


          default:

            /** the options are preconfigured in the subscription-product, orderLine needs to have them */



            let orderLineOption = orderLine.getOptionById(option.id)

            if (!orderLineOption) {
              let msg = `Orderline is missing option ${option.name}`
              console.warn(msg)
              return false
            }

            let valueIds = option.valueIds()

            if (valueIds.length > 0 && !orderLineOption.hasAtLeastOne(valueIds)) {

              let possibleValues = option.valueNames()
              let msg = `Orderline option '${option.name}' is missing specific value: ${possibleValues.join(',')}`
              console.warn(msg)
              return false
            }


        }





      }

    }


    return true

  }


  async useSubscription(subs: Subscription) {

    // whatever the current price, we need to pay the product (identified by unitProductId)
    // let product = this.mgrUiSvc.getProduct(subs.unitProductId)  //order.getLineByProduct(subs.unitProductId)

    /*

    */



    console.warn('useSubscription', subs)


    let orderLine = this.mgrUiSvc.order.getLineByProduct(subs.unitProductId)

    if (orderLine) {

      let canUseSubscription = this.canUseSubscription(orderLine, subs)

      if (canUseSubscription) {

        /** The back-end will update the subscription when saving the order */
        const payment = await this.mgrUiSvc.addPayment(orderLine.unit, PaymentType.subs, 'pos')

        payment.subsId = subs.id
        subs.usedQty++

      }


    }

  }



  get totalToPay(): number {

    if (!this.mgrUiSvc.order)
      return 0

    return _.round(this.mgrUiSvc.order.incl - this.mgrUiSvc.order.paid, 2)
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
