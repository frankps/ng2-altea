import { Component, OnInit } from '@angular/core';
import { ReviewService, SessionService } from 'ng-altea-common';
import { Review } from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss']
})
export class ReviewListComponent implements OnInit {

  reviews: Review[] = []

  constructor(protected reviewService: ReviewService, protected sessionSvc: SessionService,) {
  }

  async ngOnInit() {
    await this.getReviews()
  }


  async getReviews() {

    let qry = new DbQuery()

    //qry.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    qry.orderByDesc('cre')
    qry.take = 20
    qry.include('order')

    this.reviews = await this.reviewService.query$(qry)

    console.error('reviews', this.reviews)
  }

}
