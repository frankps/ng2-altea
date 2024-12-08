import { Component, OnInit } from '@angular/core';
import { BranchService, SessionService } from 'ng-altea-common';
import { Branch } from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  branches: Branch[] = []


  constructor(protected branchSvc: BranchService, protected sessionSvc: SessionService) { 


  }


  async ngOnInit() {
    await this.getBranches()
  } 

  openBranch(branch: Branch) {
    this.sessionSvc.branch = branch
  }

  async getBranches() {
    let me = this

    console.log('test')

    let qry = new DbQuery()

    qry.and('act',  QueryOperator.equals, true)
  
    me.branches = await me.branchSvc.query$(qry, false)

    console.log('branches', me.branches)
  }


}
