import { Component, Input, OnInit } from '@angular/core';
import { LoyaltyProgram, Order } from 'ts-altea-model';
import { LoyaltyProgramService } from '../../loyalty-program.service';
import { SessionService } from '../../session.service';
import { LoyaltyCardUi } from 'ts-altea-logic';

@Component({
  selector: 'order-mgr-loyalty',
  templateUrl: './loyalty.component.html',
  styleUrls: ['./loyalty.component.css']
})
export class LoyaltyComponent implements OnInit {

  @Input() order: Order

  @Input() loyalty: LoyaltyCardUi[]

  programs: LoyaltyProgram[]


  constructor(protected sessionSvc: SessionService, protected loyaltyProgramSvc: LoyaltyProgramService) {

  }


  async ngOnInit() {

    const branch = await this.sessionSvc.branch$()
    this.programs = await this.loyaltyProgramSvc.getAllForBranch$(branch.id)

    console.log(this.programs)
    
  }


}
