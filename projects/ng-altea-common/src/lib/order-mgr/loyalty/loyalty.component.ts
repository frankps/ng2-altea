import { Component, Input, OnInit } from '@angular/core';
import { LoyaltyProgram, Order } from 'ts-altea-model';
import { LoyaltyProgramService } from '../../loyalty-program.service';
import { SessionService } from '../../session.service';
import { LoyaltyUi, LoyaltyUiCard } from 'ts-altea-logic';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { AlteaService } from '../../altea.service';
import { ArrayHelper } from 'ts-common';

@Component({
  selector: 'order-mgr-loyalty',
  templateUrl: './loyalty.component.html',
  styleUrls: ['./loyalty.component.css']
})
export class LoyaltyComponent implements OnInit {

  @Input() order: Order

  @Input() loyalty: LoyaltyUi

  programs: LoyaltyProgram[]


  constructor(protected sessionSvc: SessionService, protected loyaltyProgramSvc: LoyaltyProgramService, protected orderMgrSvc: OrderMgrUiService, protected alteaSvc: AlteaService) {

  }


  async ngOnInit() {

    const branch = await this.sessionSvc.branch$()
    this.programs = await this.loyaltyProgramSvc.getAllForBranch$(branch.id)

    console.log(this.programs)


  }


  async addLoyalty() {

    console.error('addLoyalty')


    const registerLoyalty = this.loyalty.getApiObject(this.order.contactId)

    const loyaltyCards = await this.alteaSvc.loyaltyMgmtService.saveLoyalty(registerLoyalty)

    //this.orderMgrSvc.loyalty = this.alteaSvc.loyaltyCalculator.
    if (ArrayHelper.AtLeastOneItem(loyaltyCards))
      this.loyalty.update(loyaltyCards)


  }


}
