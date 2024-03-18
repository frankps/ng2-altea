import { Component } from '@angular/core';
import { Gift, GiftType, Order, OrderLine } from 'ts-altea-model';
import { OrderMgrUiService, OrderUiMode, OrderUiState } from 'ng-altea-common';
import { SessionService } from 'ng-altea-common';
import { ActivatedRoute, Router } from '@angular/router';
import { ObjectHelper } from 'ts-common';

@Component({
  selector: 'app-buy-gift',
  templateUrl: './buy-gift.component.html',
  styleUrls: ['./buy-gift.component.scss']
})
export class BuyGiftComponent {

  constructor(protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService, protected router: Router) {
  }

  buyGift(gift: Gift) {

/*     this.orderMgrSvc.newOrder(OrderUiMode.newGift)
    this.orderMgrSvc.gift = gift

    if (gift.type == GiftType.amount) {

      const orderLine = OrderLine.custom('Cadeaubon', gift.value, gift.vatPct)
      this.orderMgrSvc.addOrderLine(orderLine)

      console.error(this.orderMgrSvc.order)

      if (gift.invoice)
        this.orderMgrSvc.changeUiState(OrderUiState.requestInvoice)

      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])

      // then we go to Stripe
    } else {
      // otherwise we go to the catalog

      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
    } */

    let o: Order
    o.paid
  
  }


}
