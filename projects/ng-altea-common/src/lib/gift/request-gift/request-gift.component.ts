import { Component, OnInit } from '@angular/core';
import { Branch, Gift, GiftVatPct } from 'ts-altea-model';
import { StringDictionary, TranslationService } from 'ng-common'
import { SessionService } from '../../session.service';
import * as _ from "lodash";


export class AppSettings {

  internal = false
}

@Component({
  selector: 'altea-request-gift',
  templateUrl: './request-gift.component.html',
  styleUrls: ['./request-gift.component.css']
})
export class RequestGiftComponent implements OnInit {

  // branch: Branch
  gift = new Gift()

  branch: Branch

  settings: AppSettings = new AppSettings()


  vatPcts: GiftVatPct[] = []

  /** pos = Point Of Sale = In Shop */
/*   posLabel = ''
  postalLabel = '' */

  /*
  fromNameNotValid = ''
  toNameNotValid = ''
  fromEmailNotValid = ''
  toEmailNotValid = ''
  toAddressNotValid = ''
*/

  /** translated labels */
  lbl = new StringDictionary()


  constructor(protected translationSvc: TranslationService, protected sessionSvc: SessionService) {


    //this.branch = this.sessionSvc.branch

  }

  shouldSelectVatPct(): boolean {

    return (this.gift.invoice && Array.isArray(this.vatPcts) && this.vatPcts.length > 1)

  }





  async ngOnInit() {

    console.warn('ngOnInit --------')


    this.branch = await this.sessionSvc.branch$()

    console.warn('ngOnInit 2 --------')

    if (Array.isArray(this.branch.gift.invoice.vatPcts) && this.branch.gift.invoice.vatPcts.length > 0) {
      this.vatPcts = this.branch.gift.invoice.vatPcts.filter(pct => pct.on)
      this.vatPcts = _.orderBy(this.vatPcts, 'pct')

      this.gift.vatPct = this.vatPcts[0].pct
    }

    console.warn(this.vatPcts)

/*     this.posLabel = await this.translationSvc.getTrans("app.gift.methods.pos")
    this.posLabel = this.posLabel.replace('[branch]', this.branch.name)

    const postal = await this.translationSvc.getTrans("app.gift.methods.postal")
    let postalExtra = ''

    if (this.branch.gift.price.postal) {

      postalExtra = await this.translationSvc.getTrans("app.gift.methods.postalExtra")

      const price = `€${this.branch.gift.price.postal}`
      console.warn(price)
      postalExtra = postalExtra.replace('[price]', price)


    }

    this.postalLabel = `${postal} ${postalExtra} `
 */


    await this.translationSvc.getTranslations$(['app.gift.methods.pos', 'app.gift.methods.postal', 'app.gift.methods.postalExtra'], this.lbl, 'app.gift.')

    
    if (this.lbl['methods.pos'])
      this.lbl['methods.pos'] = this.lbl['methods.pos'].replace('[branch]', this.branch.name)

    if (this.branch.gift.price.postal) {
      const price = `€${this.branch.gift.price.postal}`
      this.lbl['methods.postalExtra'] = this.lbl['methods.postalExtra'].replace('[price]', price)

      this.lbl['methods.postal'] = `${this.lbl['methods.postal']} ${this.lbl['methods.postalExtra']} `
    }


    await this.translationSvc.templateReplacements$('msg.input-not-valid', this.lbl, '[input]', ['objects.gift.value', 'objects.gift.fromName', 'objects.gift.toName', 'objects.gift.fromEmail', 'objects.gift.toEmail', 'objects.gift.toAddress'], 'objects.gift.', 'InValid')

    console.error(this.lbl)


  }

  buttonNext() {

    console.warn(this.gift)
  }




}
