import { Component, OnInit } from '@angular/core';
import { SessionService } from 'ng-altea-common';
import { Branch } from 'ts-altea-model';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService } from 'ng-altea-common';

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {

  branch: Branch

  constructor(protected sessionSvc: SessionService, protected router: Router, protected orderMgrSvc: OrderMgrUiService) {

  }


 async ngOnInit() {

   this.branch = await this.sessionSvc.branch$()
    


  }


  gotoBasket() {
    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
  }

  gotoMenu() {
    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'menu'])
  }
}
