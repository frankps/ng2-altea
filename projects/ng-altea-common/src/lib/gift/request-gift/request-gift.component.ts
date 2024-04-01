import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Branch, Gift, GiftType, GiftVatPct, OrderLine } from 'ts-altea-model';
import { TranslationService } from 'ng-common'
import { SessionService } from '../../session.service';
import * as _ from "lodash";
import { OrderMgrUiService, OrderUiMode, OrderUiState } from '../../order-mgr';


export class AppSettings {
  internal = false
}

@Component({
  selector: 'altea-lib-request-gift',
  templateUrl: './request-gift.component.html',
  styleUrls: ['./request-gift.component.css']
})
export class RequestGiftComponent implements OnInit {

  @Output() request: EventEmitter<Gift> = new EventEmitter<Gift>()

  // branch: Branch
  gift 

  branch: Branch

  settings: AppSettings = new AppSettings()


  vatPcts: GiftVatPct[] = []

  /** translated labels */
  lbl = {} 

  constructor(protected translationSvc: TranslationService, protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService,) {
   
   
    

  }

  setTestData() {

    this.gift.value = 99
    this.gift.fromName = "Frank"
    this.gift.toName = "Hilde"
    this.gift.methods.pos = true

  }


  shouldSelectVatPct(): boolean {

    return (this.gift.invoice && Array.isArray(this.vatPcts) && this.vatPcts.length > 1)

  }

  async ngOnInit() {

    this.branch = await this.sessionSvc.branch$()


    this.gift = new Gift(true, true)
    this.gift.branchId = this.branch.id

    this.setTestData()

    // retrieve possible vat percentages for gifts (in case amount + invoice)
    if (Array.isArray(this.branch.gift.invoice.vatPcts) && this.branch.gift.invoice.vatPcts.length > 0) {
      this.vatPcts = this.branch.gift.invoice.vatPcts.filter(pct => pct.on)
      this.vatPcts = _.orderBy(this.vatPcts, 'pct')

      this.gift.vatPct = this.vatPcts[0].pct
    }


    const lbl = this.lbl

    /** the methods below will perform translations and put them inside this.lbl (and remove irrelevant part of key 'app.gift.' in this.lbl)*/
    await this.translationSvc.getTranslations$(['app.gift.methods.pos', 'app.gift.methods.postal', 'app.gift.methods.postalExtra'], lbl, 'app.gift.')


    if (lbl['methods.pos'])
      lbl['methods.pos'] = lbl['methods.pos'].replace('[branch]', this.branch.name)

    if (this.branch.gift.price.postal) {
      const price = `€${this.branch.gift.price.postal}`
      lbl['methods.postalExtra'] = lbl['methods.postalExtra'].replace('[price]', price)

      lbl['methods.postal'] = `${lbl['methods.postal']} ${lbl['methods.postalExtra']} `
    }


    // tranlate 'msg.input-not-valid' and replace '[input]' by respective elements from array. results in this.lbl
    await this.translationSvc.templateReplacements$('msg.input-not-valid', lbl, '[input]', ['objects.gift.value', 'objects.gift.fromName', 'objects.gift.toName', 'objects.gift.fromEmail', 'objects.gift.toEmail', 'objects.gift.toAddress'], 'objects.gift.', 'InValid')

    console.error(lbl)


  }

  buttonNext() {

    this.initGift(this.gift)

    this.request.emit(this.gift)
    console.warn(this.gift)
  }

  initGift(gift: Gift) {

    gift.newCode()

    this.orderMgrSvc.newOrder(OrderUiMode.newGift,gift)



    if (gift.type == GiftType.amount) {

      const orderLine = OrderLine.custom('Cadeaubon', gift.value, gift.vatPct)
      let setUnitPrice = false // because this is a custom price
      this.orderMgrSvc.addOrderLine(orderLine, 1, setUnitPrice)
    }

  }




}
