import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { TranslationService } from 'ng-common'
import { SessionService } from '../../session.service';
import { Branch, Gift, GiftType, RedeemGift } from 'ts-altea-model';
import { GiftService } from '../../data-services/sql/gift.service';
import { DbQuery, QueryOperator } from 'ts-common';




@Component({
  selector: 'altea-lib-redeem-gift',
  templateUrl: './redeem-gift.component.html',
  styleUrls: ['./redeem-gift.component.css']
})
export class RedeemGiftComponent implements OnInit {


  @Output() redeem: EventEmitter<RedeemGift> = new EventEmitter<RedeemGift>()

  code: string = 'AF9EF'   // AF9EF   D1BAA
  lbl = {}
  branch: Branch
  gift: Gift


  constructor(protected translationSvc: TranslationService, protected sessionSvc: SessionService, protected giftSvc: GiftService) {

  }

  async ngOnInit() {

    this.branch = await this.sessionSvc.branch$()

    console.warn(this.branch)

    const lbl = this.lbl

    // await this.translationSvc.getTranslations$(['app.redeem.methods.pos', 'app.gift.methods.postal', 'app.gift.methods.postalExtra'], lbl, 'app.gift.')

  }

  async searchGift() {

    /*
    const query = new DbQuery()
    query.and('code', QueryOperator.equals, this.code)

    const gifts = await this.giftSvc.query$(query)
*/

    const gifts = await this.giftSvc.searchGift(this.code)
    
    if (Array.isArray(gifts) && gifts.length > 0)
      this.gift = gifts[0]

    console.log(gifts)
  }

  useAmountGift() {
    this.redeem.emit(new RedeemGift(this.gift, GiftType.amount))
  }

  useSpecificGift() {
    this.redeem.emit(new RedeemGift(this.gift, GiftType.specific))
  }
}
