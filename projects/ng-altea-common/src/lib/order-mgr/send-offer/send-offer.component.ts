import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Contact, Country, Offer, TimeUnit } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'

@Component({
  selector: 'order-mgr-send-offer',
  templateUrl: './send-offer.component.html',
  styleUrls: ['./send-offer.component.css']
})
export class SendOfferComponent {


  offer: Offer = new Offer()
  css_cls_row = 'mt-3'
  initialized = false
  @ViewChild('offerForm')
  offerForm: NgForm
  country: Translation[] = []

  @Output()
  send: EventEmitter<Offer> = new EventEmitter<Offer>()

  // durations = [].map(i => { return { pct: i, label: `${i} %` } })
  minutesInHour = 60
  minutesInDay = 60 * 24

  // 
  durations = [15, 30, 60, 60 * 2, 60 * 4, 60 * 8, 60 * 12, this.minutesInDay, this.minutesInDay * 2, this.minutesInDay * 4, this.minutesInDay * 7].map(min => { return { value: min, label: `${min} minutes` } })

  timeUnitsPlur: Translation[] = []
  timeUnitsSing: Translation[] = []

  constructor(protected translationSvc: TranslationService) {
    console.warn(this.durations)
  }
  
  

  async ngOnInit() {
    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    await this.translationSvc.translateEnum(TimeUnit, 'enums.time-units-plur.', this.timeUnitsPlur)
    await this.translationSvc.translateEnum(TimeUnit, 'enums.time-units-sing.', this.timeUnitsSing)

    console.error(this.timeUnitsPlur)

    let minutesTranslation = this.timeUnitsPlur.find(t => t.key == 'm')?.trans
    let hoursTranslation = this.timeUnitsPlur.find(t => t.key == 'h')?.trans
    let hourTranslation = this.timeUnitsSing.find(t => t.key == 'h')?.trans

    let daysTranslation = this.timeUnitsPlur.find(t => t.key == 'd')?.trans
    let dayTranslation = this.timeUnitsSing.find(t => t.key == 'd')?.trans

    console.warn(this.minutesInDay)

    for (let dur of this.durations) {

      if (dur.value >= this.minutesInDay) {
        let days = dur.value / this.minutesInDay

        if (days == 1)
          dur.label = `${days} ${dayTranslation}`
        else
          dur.label = `${days} ${daysTranslation}`
      } else if (dur.value >= this.minutesInHour) {
        let hours = dur.value / this.minutesInHour

        if (hours == 1)
          dur.label = `${hours} ${hourTranslation}`
        else
          dur.label = `${hours} ${hoursTranslation}`

      } else {
        dur.label = `${dur.value} ${minutesTranslation}`
      }

    }

    console.warn(this.durations)

    this.initialized = true
  }

  sendOffer($event) {
    console.warn("Button 'sendOffer' clicked: 'sendOffer' method triggered!")
    console.warn(this.offer)
    this.send.emit(this.offer)
  }


}
