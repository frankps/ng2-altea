import { Component, Input } from '@angular/core';
import { OrderMgrUiService } from 'ng-altea-common';
import { Order } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent {

  @Input() order: Order

  /** Show payments */
  @Input() pays: boolean = false

   /** Show general order info: totals, deposit, ... */
  @Input() info: boolean = false

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

  async ngOnInit(): Promise<void> {
    //this.order = this.orderMgrSvc.order
  }

}
