import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ProductService, SessionService } from 'ng-altea-common'
import { OrderLineOption, OrderLineOptionValue, Product, ProductType } from 'ts-altea-model';



@Component({
  selector: 'order-mgr-order-line',
  templateUrl: './order-line.component.html',
  styleUrls: ['./order-line.component.scss'],
})
export class OrderLineComponent {


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

    this.orderMgrSvc.orderLine.markAsUpdated('qty')
    this.orderMgrSvc.order.makeTotals()
  }

  optionChanged(option) {

    console.warn(option)
    console.error(this.orderLine)

    this.orderLine.markAsUpdated("options")

    this.orderLine.calculateAll()
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


  }

}
