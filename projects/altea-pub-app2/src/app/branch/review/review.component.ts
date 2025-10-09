import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReviewParameter, Review } from 'ts-altea-model';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { OrderService } from 'ng-altea-common';

/* 
http://localhost:4350/branch/aqua/review/c35d3c49-f303-4ee0-85b4-b28751312cb8


To do:

- review: 
  - DB model
  - backend service
  - frontend service


 */

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent {

  reviewParams: ReviewParameter[]

  review: Review

  constructor(protected route: ActivatedRoute, protected orderSvc: OrderService) {
    this.reviewParams = ReviewParameter.getAll()
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let orderId = params['orderId']

      this.initReview(orderId)
    })
  }


  submit() {
    console.error(this.review)
  }

  async initReview(orderId: string) {
    this.review = new Review()

    if (orderId) {
      let order = await this.orderSvc.get$(orderId, ['lines', 'contact'])
      console.error(order)

      this.review.orderId = orderId
    }

    this.reviewParams.forEach(param => {
      this.review.params[param.code] = 0
    })

  }

}
