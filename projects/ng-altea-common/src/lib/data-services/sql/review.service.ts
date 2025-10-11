import { Injectable } from '@angular/core';
import { Review, Template } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService extends BackendHttpServiceBase<Review> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(Review, 'Review', sessionSvc.backend, sessionSvc.branchUnique + '/reviews', http)
  }

}
