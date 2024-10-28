import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, SessionService, SubscriptionService } from 'ng-altea-common';
import { AuthService } from '../../auth/auth.service';
import { Contact, PaymentType, Subscription } from 'ts-altea-model';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'app-my-subs',
  templateUrl: './my-subs.component.html',
  styleUrls: ['./my-subs.component.scss']
})
export class MySubsComponent implements OnInit {

  // test
  // contactId = 'd4b3e527-1bdb-40f4-8e8e-541273e26595'

  contact: Contact

  subs: Subscription[]

  constructor(protected subsSvc: SubscriptionService, protected orderMgrSvc: OrderMgrUiService,
    protected router: Router, protected authSvc: AuthService,
    protected sessionSvc: SessionService) {

  }

  async ngOnInit() {

    this.contact = this.sessionSvc.contact

    if (this.contact)
      await this.loadSubscriptions(this.contact.id)
  }


  async loadSubscriptions(contactId: string) {

    const query = new DbQuery()
    query.and("contactId", QueryOperator.equals, contactId)
    query.and("act", QueryOperator.equals, true)

    this.subs = await this.subsSvc.query$(query)

  }

  async bookSubscription(subscription: Subscription) {

    await this.orderMgrSvc.newOrder()

    const orderLines = await this.orderMgrSvc.addProductById(subscription.unitProductId)

    console.log(orderLines)
    console.log(this.orderMgrSvc.order)

    if (ArrayHelper.NotEmpty(orderLines)) {

      const turn = subscription.usedQty + 1

      /** The back-end will update the subscription when saving the order */
      const payment = await this.orderMgrSvc.addPayment(this.orderMgrSvc.order.incl, PaymentType.subs, 'app')
      payment.subsId = subscription.id
      payment.info = `Beurt ${turn} van ${subscription.totalQty}`
    }

    await this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'select-date'])
    // this.orderMgrSvc.addPayment()


  }

}
