
import { Component, OnInit, ViewChild } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Contact, Country, Offer, TimeUnit } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'


@Component({
  selector: 'altea-lib-request-invoice',
  templateUrl: './request-invoice.component.html',
  styleUrls: ['./request-invoice.component.css']
})
export class RequestInvoiceComponent implements OnInit {


  offer: Offer = new Offer()
  css_cls_row = 'mt-3'
  initialized = false
  @ViewChild('offerForm')
  offerForm: NgForm
  country: Translation[] = []

  // durations = [].map(i => { return { pct: i, label: `${i} %` } })

  durations = [15, 30, 60, 120, 240, 480].map(min => { return { value: min, label: `${min} minutes` } })

  timeUnitsPlur: Translation[] = []
  timeUnitsSing: Translation[] = []

  constructor(protected translationSvc: TranslationService) {

  }

  async ngOnInit() {
    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    await this.translationSvc.translateEnum(TimeUnit, 'enums.time-units-plur.', this.timeUnitsPlur)
    await this.translationSvc.translateEnum(TimeUnit, 'enums.time-units-sing.', this.timeUnitsSing)

    console.error(this.timeUnitsPlur)

    let hoursTranslation = this.timeUnitsPlur.find(t => t.key == 'h')?.trans
    let hourTranslation = this.timeUnitsSing.find(t => t.key == 'h')?.trans

    this.durations.forEach(dur => {

      if (dur.value >= 60) {
        let hours = dur.value / 60

        if (hours == 1)
          dur.label = `${hours} ${hourTranslation}`
        else
          dur.label = `${hours} ${hoursTranslation}`

      }

    })


    this.initialized = true
  }

  sendOffer($event) {
    console.warn("Button 'sendOffer' clicked: 'sendOffer' method triggered!")
    console.warn(this.offer)
  }

}
