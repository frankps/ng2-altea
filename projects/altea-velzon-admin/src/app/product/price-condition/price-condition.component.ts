import { Component, Input, OnInit } from '@angular/core';
import { PriceCondition, PriceConditionType, Product, ValueComparator } from 'ts-altea-model';
import { DbQuery, ObjectHelper, QueryOperator, Translation } from 'ts-common';
import { TranslationService } from 'ng-common'
import { ProductService } from 'ng-altea-common';

@Component({
  selector: 'price-condition',
  templateUrl: './price-condition.component.html',
  styleUrls: ['./price-condition.component.scss']
})
export class PriceConditionComponent implements OnInit {

  @Input() condition: PriceCondition 

  priceConditionTypes: Translation[] = []
  valueComparators: Translation[] = []
  subscriptionUnitProducts: Product[] = []

  initialized = false

  constructor(protected translationSvc: TranslationService, protected productSvc: ProductService) {

  }

  async ngOnInit() {

    await this.translationSvc.translateEnum(PriceConditionType, 'enums.price-condition-type.', this.priceConditionTypes)
    await this.translationSvc.translateEnum(ValueComparator, 'enums.value-comparator.', this.valueComparators)

    this.subscriptionUnitProducts = await this.productSvc.subscriptionUnitProducts()

    console.error(this.subscriptionUnitProducts)

    this.initialized = true
  }

}
