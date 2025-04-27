import { Component, Input, OnInit } from '@angular/core';
import { LoyaltyCard, LoyaltyPayInfo, LoyaltyProgram, LoyaltyReward, LoyaltyRewardType, Order, OrderLine, PaymentType } from 'ts-altea-model';
import { LoyaltyProgramService } from '../../data-services/sql/loyalty-program.service';
import { SessionService } from '../../session.service';
import { LoyaltyUi, LoyaltyUiCard } from 'ts-altea-logic';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { AlteaService } from '../../altea.service';
import { ArrayHelper } from 'ts-common';
import { DashboardService } from 'ng-common';
import { NgxSpinnerService } from 'ngx-spinner';
import * as _ from "lodash";

@Component({
  selector: 'order-mgr-loyalty',
  templateUrl: './loyalty.component.html',
  styleUrls: ['./loyalty.component.css']
})
export class LoyaltyComponent implements OnInit {

  @Input() loyalty: LoyaltyUi

  programs: LoyaltyProgram[]


  _order: Order
  @Input() set order(value: Order) {
    this._order = value
  }

  get order(): Order {
    return this._order
  }


  constructor(protected sessionSvc: SessionService, protected loyaltyProgramSvc: LoyaltyProgramService
    , protected orderMgrSvc: OrderMgrUiService, protected alteaSvc: AlteaService, public dashboardSvc: DashboardService, public spinner: NgxSpinnerService
  ) {

  }


  async ngOnInit() {

    const branch = await this.sessionSvc.branch$()
    this.programs = await this.loyaltyProgramSvc.getAllForBranch$(branch.id)

    console.log(this.programs)


  }

  async useReward(reward: LoyaltyReward, cardUi: LoyaltyUiCard) {

    console.log(this.loyalty)


    let loyaltyCard: LoyaltyCard = cardUi.card
    let loyaltyProgram: LoyaltyProgram = cardUi.program



    console.log(reward)

    let rewardAmound = 0


    switch (reward.type) {
      case LoyaltyRewardType.productDiscount:
      case LoyaltyRewardType.discount:
        rewardAmound = reward.discount
        break

      case LoyaltyRewardType.freeProduct:

        // this recalculates the loyalty
        let rewardOrderLines: OrderLine[] = []

        if (this.orderMgrSvc.containsProduct(reward.product.id))
          rewardOrderLines = this.orderMgrSvc.getOrderLines(reward.product.id)
        else
          rewardOrderLines = await this.orderMgrSvc.addProductById(reward.product.id)

        rewardAmound = _.sumBy(rewardOrderLines, 'incl')
        break

      case LoyaltyRewardType.discount:
        rewardAmound = reward.discount
        break
    }

    let pay = await this.orderMgrSvc.addPayment(rewardAmound, PaymentType.loyal, this.sessionSvc.loc)

    //    pay.loyalId = loyaltyProgram.id
    pay.loyal = new LoyaltyPayInfo(loyaltyCard.id, reward.id)

    cardUi.current -= reward.amount

    console.log(cardUi)

    console.log(this.loyalty)

  }

  canAddLoyalty() : boolean {

    let order = this.order
    let now = new Date()

    if (order.start) {

      if (order.startDate > now)
        return false

    }

    return this.loyalty.newLoyalty && (order?.contactId != null)
  }

  async addLoyalty() {

    console.error('addLoyalty')

    let error

    try {
      this.spinner.show()

      const registerLoyalty = this.loyalty.getApiObject()

      const loyaltyCards = await this.alteaSvc.loyaltyMgmtService.saveLoyalty(registerLoyalty)

      //this.orderMgrSvc.loyalty = this.alteaSvc.loyaltyCalculator.
      if (ArrayHelper.AtLeastOneItem(loyaltyCards))
        this.loyalty.update(loyaltyCards)

    } catch (err) {

      console.error(err)
      error = 'Probleem met klantenkaar bijwerken!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('Klantenkaart bijgewerkt')

    }






  }


}
