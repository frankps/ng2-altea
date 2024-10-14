import { Component, Input } from '@angular/core';
import { OrderMgrUiService, SessionService } from 'ng-altea-common';
import { Branch, Order } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent {

  @Input() order: Order

  /** Show payments */
  @Input() pays: boolean = false

  /** Show totals */
  @Input() totals: boolean = false

   /** Show general order info: totals, deposit, ... */
  @Input() info: boolean = false

  branch: Branch

  initialised = false

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService) {

  }

  async ngOnInit(): Promise<void> {
    //this.order = this.orderMgrSvc.order

    this.branch = await this.sessionSvc.branch$()

    this.initialised = true
  }

}
