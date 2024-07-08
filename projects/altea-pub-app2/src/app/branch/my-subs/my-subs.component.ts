import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, SessionService, SubscriptionService } from 'ng-altea-common';
import { PaymentType, Subscription } from 'ts-altea-model';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'app-my-subs',
  templateUrl: './my-subs.component.html',
  styleUrls: ['./my-subs.component.scss']
})
export class MySubsComponent implements OnInit {

  // test
  contactId = 'd4b3e527-1bdb-40f4-8e8e-541273e26595'

  subs: Subscription[]

  constructor(protected subsSvc: SubscriptionService, protected orderMgrSvc: OrderMgrUiService,  protected router: Router,
    protected sessionSvc: SessionService) {

  }

  async ngOnInit() {

    await this.loadSubscriptions(this.contactId)

  }


  async loadSubscriptions(contactId: string) {

    const query = new DbQuery()
    query.and("contactId", QueryOperator.equals, contactId)
    query.and("act", QueryOperator.equals, true)

    this.subs = await this.subsSvc.query$(query)

  }

  async bookSubscription(subs: Subscription) {

    await this.orderMgrSvc.newOrder()

    const orderLines = await this.orderMgrSvc.addProductById(subs.unitProductId)

    console.log(orderLines)
    console.log(this.orderMgrSvc.order)

    if (ArrayHelper.NotEmpty(orderLines)) {

      /** The back-end will update the subscription when saving the order */
      const payment =this.orderMgrSvc.addPayment(this.orderMgrSvc.order.incl, PaymentType.subs, 'pos')
      payment.subsId = subs.id
    }

    await this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
    // this.orderMgrSvc.addPayment()


  }

}
