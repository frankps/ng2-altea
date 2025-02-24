import { Component, Input, OnInit } from '@angular/core';
import { ProductRule, ProductRuleType, Schedule } from 'ts-altea-model';
import { DbQuery, QueryOperator, Translation } from 'ts-common';
import { TranslationService } from 'ng-common'
import { ScheduleService, SessionService } from 'ng-altea-common';
import * as _ from "lodash"

@Component({
  selector: 'ngx-altea-product-rule',
  templateUrl: './product-rule.component.html',
  styleUrls: ['./product-rule.component.scss'],
})
export class ProductRuleComponent implements OnInit {

  ruleTypes: Translation[] = []

  @Input() rule: ProductRule

  @Input() schedules: Schedule[]


  time: string | Date = "13:45"
  // hours = [...Array(23).keys()].map(i => ("0" + i).slice(-2))
  // hour = "09"

  // minutes = [...Array(59).keys()].map(i => ("0" + i).slice(-2))
  // minute = "00"

  constructor(private translationSvc: TranslationService, private sessionSvc: SessionService) {

    


  }

  async ngOnInit() {
    await this.translationSvc.translateEnum(ProductRuleType, 'enums.product-rule-type.', this.ruleTypes)
  }


/*   addTime() {

    if (!this.rule.startAt)
      this.rule.startAt = []

    if (typeof this.time === "string")
      this.rule.startAt.push(this.time)

    this.rule.startAt = _.sortBy(this.rule.startAt)

  }


  deleteTime(time) {

    _.remove(this.rule.startAt, t => t === time)


  } */


}
