import { Component, Input, OnInit } from '@angular/core';
import { DaysOfWeekShort, Price } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import {Translation } from 'ts-common'

@Component({
  selector: 'ngx-altea-product-price',
  templateUrl: './product-price.component.html',
  styleUrls: ['./product-price.component.scss'],
})
export class ProductPriceComponent implements OnInit {

  @Input() object?: Price

  daysOfWeekShort: Translation[] = []


  constructor (private translationSVc: TranslationService) {
    
  }
  // "days-of-week-short"

  async ngOnInit() {

    const daysOfWeekShort = await this.translationSVc.translateEnum(DaysOfWeekShort, 'enums.days-of-week-short.', this.daysOfWeekShort)
    
    // make sure monday=1, ... saturday=6, sunday=0
    let value = 1
    daysOfWeekShort.forEach(day => day.value = value++ % 7)
    

  }

}
