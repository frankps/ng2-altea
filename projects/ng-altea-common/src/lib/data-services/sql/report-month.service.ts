import { Injectable } from '@angular/core';
import { ProductOption, ReportMonth } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';


@Injectable({
  providedIn: 'root'
})
export class ReportMonthService extends BackendHttpServiceBase<ReportMonth> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(ReportMonth, 'ReportMonth', sessionSvc.backend, sessionSvc.branchUnique + '/report-month', http)
  }

}




/*
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportMonthService {

  constructor() { }
}
*/