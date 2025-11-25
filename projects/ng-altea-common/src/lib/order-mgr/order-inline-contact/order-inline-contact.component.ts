import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core'
import { Order } from 'ts-altea-model';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { StringHelper } from 'ts-common';

/**
 * 
 * http://localhost:4350/branch/aqua/open/revealight-testbeurt
 */


@Component({
  selector: 'order-mgr-order-inline-contact',
  templateUrl: './order-inline-contact.component.html',
  styleUrls: ['./order-inline-contact.component.css']
})
export class OrderInlineContactComponent {

  @Output() inlineContactSaved: EventEmitter<Order> = new EventEmitter<Order>();

  @Input() order: Order
  inputsRequired = true
  orderDirtyOnChange = true
  css_cls_row = 'mt-3'

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

  ngOnInit() {
    console.error('ngOnInit')
    
    // this.order.for = 'Frank Paepens'
    // this.order.email = 'frank@dvit.eu'
    // this.order.mobile = '+32478336034'
    // this.propertyChanged('for')
    // this.propertyChanged('email')
    // this.propertyChanged('mobile')


  }

  propertyChanged(property: string, event?: any) {

    if (property)
      this.order.m.setDirty(property)


    if (this.orderDirtyOnChange)
      this.orderMgrSvc.orderDirty = true
  }


  contactInfoValid() : boolean {

    if (!this.order.for || this.order.for.length < 5)
      return false

    if (!StringHelper.isEmail(this.order.email))
      return false

    if (!StringHelper.isMobileNumber(this.order.mobile))
      return false

    return true
  }

  async updateOrderContact() {

    let autoChangeState = false

    if (this.order.incl == 0)  
      autoChangeState = true   // this will put the order in the confirmed state

    let res = await this.orderMgrSvc.saveOrder(autoChangeState)

    console.error('Order saved: ', res)

    this.inlineContactSaved.emit(this.orderMgrSvc.order)
  }

}
