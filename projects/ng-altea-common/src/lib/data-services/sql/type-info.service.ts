import { Injectable } from '@angular/core';
import { Template, TypeInfo } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';

@Injectable({
  providedIn: 'root'
})
export class TypeInfoService extends BackendHttpServiceBase<TypeInfo> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(TypeInfo, 'TypeInfo', sessionSvc.backend, sessionSvc.branchUnique + '/type-infos', http)
  }

}
