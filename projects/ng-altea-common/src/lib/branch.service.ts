import { Injectable } from '@angular/core';
import { Branch, Contact } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class BranchService extends BackendHttpServiceBase<Branch> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Branch, sessionSvc.backend, sessionSvc.branchUnique + '/branches', http)
  }

}
