import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Gift, RedeemGift } from 'ts-altea-model';
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

    console.error(redeemGift)

    await this.orderMgrSvc.redeemGift(redeemGift)

    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])


    //gift.l
    
  }
}
