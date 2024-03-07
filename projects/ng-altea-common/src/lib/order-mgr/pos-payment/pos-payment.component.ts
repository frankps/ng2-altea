import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Gift, Payment } from 'ts-altea-model';
import { GiftService } from '../../gift.service';
import { SessionService } from '../../session.service';

@Component({
  selector: 'order-mgr-pos-payment',
  templateUrl: './pos-payment.component.html',
  styleUrls: ['./pos-payment.component.scss']
})
export class PosPaymentComponent {

  amount: number

  giftCode: string = 'BB'

  showGifts = false
  gifts: Gift[]

  constructor(protected mgrUiSvc: OrderMgrUiService, protected giftSvc: GiftService, protected sessionSvc: SessionService) {
  }

  async addPayment(type: string) {

    if (type == 'gift') {
      await this.startGift()
    } else {
      this.mgrUiSvc.addPayment(this.amount, type, 'pos')
    }

  }


  async startGift() {

    if (!this.giftCode)
      return

    this.gifts = await this.giftSvc.searchGift(this.giftCode)

    if (this.gifts.length > 1) {
      this.showGifts = true
    } else if (this.gifts.length == 1) {

      let gift = this.gifts[0]

      this.useGift(gift)
    }

    console.warn(this.gifts)
  }

  useGift(gift: Gift) {

    /*
    let giftAmount = gift.availableAmount()

    let amount = Math.min(this.amount, giftAmount)
*/
    let canUse = gift.canUse(this.amount)

    if (canUse.valid && canUse.amount > 0) {
      const payment = this.mgrUiSvc.addPayment(canUse.amount, 'gift', 'pos')
      payment.giftId = gift.id
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

}
