import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderLine, OrderLineOption, ProductOption } from 'ts-altea-model';
import { OrderLineComponent } from '../order-line.component';

@Component({
  selector: 'order-mgr-order-line-option',
  templateUrl: './order-line-option.component.html',
  styleUrls: ['./order-line-option.component.css']
})
export class OrderLineOptionComponent {

  @Input() productOption: ProductOption

  @Input() parent: OrderLineComponent
  @Input() orderLine: OrderLine
  @Input() orderLineOption: OrderLineOption

  

}
