import { Injectable } from '@angular/core';
import { NewBranch, Organisation, Branch } from 'ts-altea-model';
import { BranchService } from '../data-services/sql/branch.service';
import { OrganisationService } from '../data-services/sql/organisation.service';
import * as sc from 'stringcase'


@Injectable({
  providedIn: 'root'
})
export class NewBranchService {

  constructor(private orgSvc: OrganisationService, private branchSvc: BranchService) { }

  async createBranch(newBranch: NewBranch) {


    console.log('createBranch', newBranch)
    
    let org = new Organisation()
    org.name = newBranch.name
    org.unique = sc.spinalcase(newBranch.name)
    var orgRes = await this.orgSvc.create$(org)

    let branch = new Branch()
    branch.id = org.id
    branch.name = newBranch.name
    branch.unique = sc.spinalcase(newBranch.name)
    
    branch.orgId = org.id
    var branchRes = await this.branchSvc.create$(branch)

    console.log('branch', branchRes)

  //  await this.branchSvc.create$(newBranch)

  }

}
