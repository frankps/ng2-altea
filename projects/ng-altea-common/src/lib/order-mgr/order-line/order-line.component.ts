import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ProductService, SessionService } from 'ng-altea-common'
import { OrderLine, OrderLineOption, OrderLineOptionValue, Product, ProductType } from 'ts-altea-model';



@Component({
  selector: 'order-mgr-order-line',
  templateUrl: './order-line.component.html',
  styleUrls: ['./order-line.component.scss'],
})
export class OrderLineComponent {

  @Input() showConfirm = true

  @Output() new: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();
  @Output() delete: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();

  @Output() confirm: EventEmitter<OrderLine> = new EventEmitter<OrderLine>();

  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  // create array from 1 to 20 , to select quantity
  qtyArray = [...Array(20).keys()].map(i => i + 1)

  constructor(protected orderMgrSvc: OrderMgrUiService, private productSvc: ProductService, protected sessionSvc: SessionService) {
  }

  get product() {
    return this.orderMgrSvc.product
  }

  get orderLineOptions() {
    return this.orderMgrSvc.orderLineOptions
  }

  get orderLine() {
    return this.orderMgrSvc.orderLine
  }

  qtyChanged() {
    console.error(this.orderMgrSvc.orderLine)

    this.orderMgrSvc.orderDirty = true
    this.orderMgrSvc.orderLine.markAsUpdated('qty')
    this.orderMgrSvc.calculateAll()
  }

  // orderMgrSvc.addOrderLine(orderLine)

  addOrderLine(orderLine: OrderLine) {



    this.orderMgrSvc.addOrderLine(orderLine)
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

}
