import { Component } from '@angular/core';
import { Gift, GiftType, OrderLine } from 'ts-altea-model';
import { OrderMgrUiService, OrderUiMode } from 'ng-altea-common';
import { SessionService } from 'ng-altea-common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-buy-gift',
  templateUrl: './buy-gift.component.html',
  styleUrls: ['./buy-gift.component.scss']
})
export class BuyGiftComponent {

  constructor(protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService, protected router: Router) {
  }

  buyGift(gift: Gift) {

    this.orderMgrSvc.newOrder(OrderUiMode.newGift)
    this.orderMgrSvc.gift = gift

    if (gift.type == GiftType.amount) {

      const orderLine = OrderLine.custom('Cadeaubon', gift.value, gift.vatPct)
      this.orderMgrSvc.addOrderLine(orderLine)

      console.error(this.orderMgrSvc.order)

      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])

      // then we go to Stripe
    } else {
      // otherwise we go to the catalog

      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])

    }



  }


}
