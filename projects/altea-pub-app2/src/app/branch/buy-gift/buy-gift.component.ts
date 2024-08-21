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

    console.warn(this.orderMgrSvc.order.incl)

    if (gift.invoice)
      this.orderMgrSvc.changeUiState(OrderUiState.requestInvoice)

    if (gift.type == GiftType.amount) {


      // 'pay-online'
      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'pay-online'])

      // then we go to Stripe
    } else {
      // otherwise we go to the catalog

      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'browse-catalog'])
    }

  }   
}


/*
this.orderMgrSvc.newOrder(OrderUiMode.newGift)
this.orderMgrSvc.gift = gift

if (gift.type == GiftType.amount) {

  const orderLine = OrderLine.custom('Cadeaubon', gift.value, gift.vatPct)
  let setUnitPrice = false // because this is a custom price
  this.orderMgrSvc.addOrderLine(orderLine)

  console.error(this.orderMgrSvc.order)

  if (gift.invoice)
    this.orderMgrSvc.changeUiState(OrderUiState.requestInvoice)

  // 'pay-online'
  this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'pay-online'])

  // then we go to Stripe
} else {
  // otherwise we go to the catalog

  this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'browse-catalog'])
}*/






