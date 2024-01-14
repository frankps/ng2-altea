import { Component, OnInit } from '@angular/core';
import { SessionService } from 'ng-altea-common';
import { Branch } from 'ts-altea-model';

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {

  branch: Branch

  constructor(protected sessionSvc: SessionService) {

  }


 async ngOnInit() {

   this.branch = await this.sessionSvc.branch$()
    
  }


}
