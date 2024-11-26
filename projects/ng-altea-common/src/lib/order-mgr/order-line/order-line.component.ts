import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ProductService, SessionService } from 'ng-altea-common'
import { OrderLine, OrderLineOption, OrderLineOptionValue, Price, PriceChange, PriceChangeType, Product, ProductType } from 'ts-altea-model';
import { ArrayHelper } from 'ts-common';



@Component({
  selector: 'order-mgr-order-line',
  templateUrl: './order-line.component.html',
  styleUrls: ['./order-line.component.scss'],
})
export class OrderLineComponent implements OnInit {

  @Input() showConfirm = true

  @Output() new: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();
  @Output() delete: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();

  @Output() confirm: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();

  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  // create array from 1 to 20 , to select quantity
  qtyArray = [] // [...Array(20).keys()].map(i => i + 1)

  prices = {}

  constructor(protected orderMgrSvc: OrderMgrUiService, private productSvc: ProductService, protected sessionSvc: SessionService) {
  }

  ngOnInit(): void {

    /*
    if (this.orderMgrSvc.product) {

      let minQty = 1

      if (this.orderMgrSvc.product.minQty)
        minQty = this.orderMgrSvc.product.minQty


      this.qtyArray = [...Array(20).keys()].map(i => i + minQty)
    }
      */

  }

  setQtyArray(product: Product) {
    let minQty = 1

    if (product)
      minQty = product.minQty

    this.qtyArray = [...Array(21 - minQty).keys()].map(i => i + minQty)
  }

  @Input() set product(product: Product) {
    this.setQtyArray(product)
  }

  _orderLine: OrderLine

  @Input() set orderLine(line: OrderLine) {

    this._orderLine = line

    this.prices = {}

    if (!line)
      return

    if (line.hasPriceChanges()) {
      line.pc.forEach(priceChange => { this.prices[priceChange.id] = true })
    }
  }

  get orderLine() {
    return this._orderLine //this.orderMgrSvc.orderLine
  }

  get product() {
    return this.orderMgrSvc.product
  }

  get orderLineOptions() {
    return this.orderMgrSvc.orderLineOptions
  }



  qtyChanged() {
    console.error(this.orderMgrSvc.orderLine)

    this.orderMgrSvc.orderDirty = true
    this.orderMgrSvc.orderLine.markAsUpdated('qty')

    this.orderMgrSvc.updateNrOfPersons()

    this.orderMgrSvc.calculateAll()
  }

  // orderMgrSvc.addOrderLine(orderLine)


  getSelectedPrices(): Price[] {

    if (!this.prices)
      return []

    let product = this.product

    if (ArrayHelper.IsEmpty(product?.prices))
      return []

    let prices: Price[] = []

    Object.keys(this.prices).forEach(priceId => {

      const selected = this.prices[priceId]

      if (!selected)
        return

      let price = product.prices?.find(price => price.id == priceId)

      if (price)
        prices.push(price)

    })

    return prices
  }


  addOrderLine(orderLine: OrderLine) {

    // let prices = this.getSelectedPrices()

    this.orderMgrSvc.addOrderLine(orderLine, 1, true)  // , prices
    this.new.emit(orderLine)

  }


  goBack() {
    this.back.emit()

  }

  closeOrderLine() {

  }

  deleteOrderLine() {
    const orderLine = this.orderMgrSvc.orderLine

    this.orderMgrSvc.deleteCurrentOrderLine()
    this.delete.emit(orderLine)
  }


  optionChanged(option: OrderLineOption, optionValue: OrderLineOptionValue) {

    console.error(this.orderLine)
    console.warn(option)

    console.error(optionValue)


    this.updateOldOrders()


    this.orderLine.markAsUpdated("options")

    console.error('has price!!')

    this.orderLine.calculateAll()

    this.orderMgrSvc.calculateAll()


    this.orderMgrSvc.order.refreshSummary()

    const productOption = this.product.getOption(option.id)

    if (productOption?.persons)
      this.orderMgrSvc.updateNrOfPersons()

    this.orderMgrSvc.orderDirty = true

    console.error(this.orderLine)
    console.error(this.orderMgrSvc.order)
  }


  updateOldOrders() {

    if (this.orderMgrSvc.order?.cre > new Date(2024, 9, 16))
      return

    if (this.product?.hasOptions()) {

      let lineOptionChanged = false

      for (let productOption of this.product.options) {

        let lineOption = this.orderLine.getOptionById(productOption.id)

        if (productOption.hasPrice) {

          if (lineOption.hasValues()) {
            for (let lineOptionValue of lineOption.values) {

              let productOptionValue = productOption.getValue(lineOptionValue.id)

              if (productOptionValue?.price && lineOptionValue.prc != productOptionValue.price) {
                lineOptionValue.prc = productOptionValue.price
                lineOptionChanged = true
              }

            }
          }

        }

        if (productOption.hasFormula && !lineOption.hasFormula()) {
          lineOption.setFormula(productOption)
          lineOptionChanged = true
        }

      }

      if (lineOptionChanged) {
        this.orderLine.markAsUpdated("options")
        this.orderLine.calculateAll()
      }


    }





  }


  multiOptionValueChanged(option: OrderLineOption, value: OrderLineOptionValue, selected: boolean) {

    console.warn(option, value, selected)

    const olOption = this.orderLine.getOption(option)
    console.error(olOption)

    if (selected) {

      const olOptionValue = olOption.getValue(value)
      console.error(olOptionValue)

      console.error(this.orderLine)
    } else { // de-selected

      olOption.removeValueById(value.id)

    }

    this.orderLine.markAsUpdated("options")
    this.orderMgrSvc.orderDirty = true


  }

  triggerConfirm() {

    if (this.orderMgrSvc.orderLineIsNew)
      this.addOrderLine(this.orderLine)
    else
      this.confirm.emit(this.orderLine)
  }

  toggleSpecialPrice(price: Price, $event) {

    if (!price)
      return

    let priceId = price.id

    let priceSelected: boolean = this.prices[priceId]
    let hasPriceChangeAlreadyApplied = this.orderLine.hasPriceChange(priceId)

    if (priceSelected) {

      if (hasPriceChangeAlreadyApplied) {
        console.log(`Price ${priceId} already applied`)
      } else {

        let priceChange = new PriceChange()

        if (price.extraQty?.on) {  // if this is not a 'real' price change, but instead customer receives extra quantity
          priceChange.tp = PriceChangeType.subsQty
          priceChange.val = price.extraQty.val
          priceChange.pct = price.extraQty.pct
        }
        else {
          priceChange.tp = PriceChangeType.price
          priceChange.val = price.value
          priceChange.pct = price.isPercentage
        }

        priceChange.id = priceId

        priceChange.info = price.title

        this.orderLine.addPriceChange(priceChange)

        this.orderMgrSvc.calculateAll()

        this.orderMgrSvc.orderDirty = true
        this.orderMgrSvc.orderLine.markAsUpdated('pc')


      }

    } else {

      if (hasPriceChangeAlreadyApplied) {

        this.orderLine.removePriceChanges(priceId)

        this.orderMgrSvc.calculateAll()

        this.orderMgrSvc.orderDirty = true
        this.orderMgrSvc.orderLine.markAsUpdated('pc')
      }

    }




    //console.log(this.prices)

  }

  toggleGiftOptionPrice(price, $event) {
    console.error(price, $event)
  }
}
