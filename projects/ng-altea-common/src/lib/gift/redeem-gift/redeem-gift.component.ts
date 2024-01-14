import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { TranslationService } from 'ng-common'
import { SessionService } from '../../session.service';
import { Branch, Gift } from 'ts-altea-model';
import { GiftService } from '../../gift.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'altea-lib-redeem-gift',
  templateUrl: './redeem-gift.component.html',
  styleUrls: ['./redeem-gift.component.css']
})
export class RedeemGiftComponent implements OnInit {


  @Output() select: EventEmitter<Gift> = new EventEmitter<Gift>()

  code: string = 'B241F'
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

    const query = new DbQuery()
    query.and('code', QueryOperator.equals, this.code)

    /*     query.and('deleted', QueryOperator.equals, false)
        query.take = 200
        query.select('id', 'catId', 'name', 'type') */


    const gifts = await this.giftSvc.query$(query)

    if (Array.isArray(gifts) && gifts.length > 0)
      this.gift = gifts[0]

    console.log(gifts)
  }

  useGift() {
    this.select.emit(this.gift)
  }

}
