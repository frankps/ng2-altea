import { Component } from '@angular/core';
import { NewBranchService } from 'ng-altea-common';
import { NewBranch } from 'ts-altea-model';

@Component({
  selector: 'create-branch',
  templateUrl: './create-branch.component.html',
  styleUrls: ['./create-branch.component.css']
})
export class CreateBranchComponent {

  newBranch: NewBranch = new NewBranch()

  constructor(protected newBranchSvc: NewBranchService) { 

  }
}
