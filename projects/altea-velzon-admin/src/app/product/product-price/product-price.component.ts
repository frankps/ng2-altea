import { Component, Input, OnInit } from '@angular/core';
import { DaysOfWeekShort, OptionPrice, Price, PriceCondition, PriceMode, Product, ProductOption } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'
import { th } from 'date-fns/locale';
import * as _ from "lodash";

@Component({
  selector: 'ngx-altea-product-price',
  templateUrl: './product-price.component.html',
  styleUrls: ['./product-price.component.scss'],
})
export class ProductPriceComponent implements OnInit {

  @Input() product: Product
  @Input() object?: Price

  daysOfWeekShort: Translation[] = []

  pricePcts = [...Array(101).keys()].map(i => { return { pct: i - 50, label: `${i - 50} %` } })

  newOptionPrice: OptionPrice  //= new OptionPrice()

  optionValues = []

  showAddOptionPanel = false

  conditionInEdit: PriceCondition = null
  newCondition = new PriceCondition()

  constructor(private translationSVc: TranslationService) {

    this.pricePcts = _.orderBy(this.pricePcts, ['pct'], ['desc'])
    this.setNewOptionPrice()
  }
  // "days-of-week-short"

  async ngOnInit() {

    const daysOfWeekShort = await this.translationSVc.translateEnum(DaysOfWeekShort, 'enums.days-of-week-short.', this.daysOfWeekShort, true)

    // make sure monday=1, ... saturday=6, sunday=0
    let value = 1
    daysOfWeekShort.forEach(day => day.value = value++ % 7)

    // console.error(this.object)

  }

  editCondition(condition: PriceCondition) {

    if (condition != this.conditionInEdit)
      this.conditionInEdit = condition
    else
      this.conditionInEdit = null
  }

  addCondition(newCondition: PriceCondition) {

    if (!this.object)
      return

    if (!this.object.cond)
      this.object.cond = []

    this.object.cond.push(newCondition)

    this.newCondition = new PriceCondition()

  }


  toggleShowAddOptionPanel() {
    const newState = !this.showAddOptionPanel

    if (newState)
      this.setNewOptionPrice()


    this.showAddOptionPanel = newState

    console.log(this.newOptionPrice)
  }

  newOptionIsValid() {

    return (this.newOptionPrice && this.newOptionPrice.optionId && this.newOptionPrice.value)

  }

  setNewOptionPrice() {
    this.newOptionPrice = new OptionPrice()

    if (!this.product)
      return
    const firstOption = this.product.options[0]

    this.newOptionPrice.optionId = firstOption.id
    //this.newOptionPrice.name = firstOption.name

    this.optionChanged(firstOption)
    console.log(this.newOptionPrice)
  }

  changePriceMode(event) {

    console.warn(event)
    console.warn(this.object.mode)

    switch (this.object.mode) {
      case PriceMode.same:
        this.object.value = this.product.salesPrice
        break
      case PriceMode.abs:
        this.object.value = this.product.salesPrice
        break
      case PriceMode.pct:
        this.object.value = 0
        break

    }
  }

  optionChanged(productOption: ProductOption) {

    if (productOption)
      this.newOptionPrice.name = productOption.name
    else
      this.newOptionPrice.name = ''



    if (productOption.hasValues())
      this.optionValues = productOption.values.map(option => { return { id: option.id, name: option.name } })





    //console.warn(event)

  }

  changeHasOptions(event) {

    if (this.object.hasOptions) {

      if (this.product.hasOptions())
        this.newOptionPrice.optionId = this.product.options[0].id

    }
  }


  addOptionPrice() {

    if (!Array.isArray(this.object.options))
      this.object.options = []

    this.object.options.push(this.newOptionPrice)

    this.showAddOptionPanel = false


    this.setNewOptionPrice()


  }

  deleteOptionPrice(idx: number) {

    this.object.options.splice(idx, 1)

  }

}
