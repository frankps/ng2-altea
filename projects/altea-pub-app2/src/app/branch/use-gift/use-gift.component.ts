import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Gift, GiftType, RedeemGift } from 'ts-altea-model';
import { OrderMgrUiService } from 'ng-altea-common';
import { SessionService } from 'ng-altea-common';

@Component({
  selector: 'app-use-gift',
  templateUrl: './use-gift.component.html',
  styleUrls: ['./use-gift.component.scss']
})
export class UseGiftComponent {

  constructor(protected sessionSvc: SessionService, protected orderMgrSvc: OrderMgrUiService, protected router: Router) {
  }

  async useGift(redeemGift: RedeemGift) {

    let me = this

    console.log(me.orderMgrSvc.order)


    console.error(redeemGift)

    await this.orderMgrSvc.redeemGift(redeemGift)

    console.log(me.orderMgrSvc.order)
    
    if (redeemGift.mode == GiftType.specific) {
      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'order'])
    } else {
      this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'browse-catalog'])
    }
    
  }
}
