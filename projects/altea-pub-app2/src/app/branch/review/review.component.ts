import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReviewParameter, Review, Order, Contact, ContactReviews, ReviewPlatform, ReviewStatus } from 'ts-altea-model';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { ContactService, ObjectService, OrderService, ReviewService, SessionService } from 'ng-altea-common';
import { NgxSpinnerService } from "ngx-spinner"
import { Clipboard } from '@angular/cdk/clipboard';
import { AlteaDb } from 'ts-altea-logic';


/* 
http://localhost:4350/branch/aqua/review/c35d3c49-f303-4ee0-85b4-b28751312cb8


To do:

- review: 
  - DB model
  - backend service
  - frontend service


  https://g.page/r/CbYLs-dnZXiWEBM/review


  https://chatgpt.com/g/g-p-686ea3570f8881918546d575e31241d4-aquasense/c/68e69e47-8bbc-8329-a7fc-99af420a72b1


 */

export enum ReviewMode {
  init = 'init',
  review = 'review',
  alreadyReviewed = 'alreadyReviewed',
  orderNotExisting = 'orderNotExisting',
  requestGoogleReview = 'requestGoogleReview',
  finaliseReview = 'finaliseReview'
}

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent {

  alteaDb: AlteaDb

  googleWriteReviewUrl = 'https://g.page/r/CbYLs-dnZXiWEBM/review';

  ReviewMode = ReviewMode

  mode: ReviewMode = ReviewMode.init

  reviewParams: ReviewParameter[]

  review: Review

  /** the order for which the review is created */
  order: Order

  /** the contact who creates the review */
  contact: Contact

  /** true: the user entered feedback & it is saved */
  feedbackSaved = false

  debug = false

  constructor(protected route: ActivatedRoute, protected orderSvc: OrderService, protected reviewSvc: ReviewService, protected contactSvc: ContactService,
    protected spinner: NgxSpinnerService, protected sessionSvc: SessionService, protected clipboard: Clipboard, protected objSvc: ObjectService) {
    this.reviewParams = ReviewParameter.getAll()

    this.alteaDb = new AlteaDb(this.objSvc, this.sessionSvc.branchId)
  }

  ngOnInit() {

    this.route.params.subscribe(params => {
      let orderId = params['orderId']

      this.initReview(orderId)
    })
  }

  async updateReview() {

    await this.reviewSvc.update$(this.review)

    if (this.review.hasCustomFeedback())
      this.feedbackSaved = true

  }


  async openGoogleAndCopyIfPresent(review: Review) {

    review.addTag('google-review')
    await this.reviewSvc.update$(review)

    await this.registerReviewOnContact(ReviewPlatform.google)

    const text = this.review.feedback?.trim();

    if (text) {
      this.clipboard.copy(text);        // optional toast: “Gekopieerd — plak in Google”
    }
    window.open(this.googleWriteReviewUrl, '_blank', 'noopener,noreferrer');

    //this.mode = ReviewMode.finaliseReview
  }

  allFilledIn() {

    for (let param of this.reviewParams) {
      if (this.review.params[param.code] == 0)
        return false
    }

    return true
  }


  async initReview(orderId: string) {
    this.review = new Review()

    let order: Order = null

    if (orderId) {
      order = await this.orderSvc.get$(orderId, ['lines', 'contact'])   // 'reviews',

      console.error(order)
    }

    if (order) {
      this.order = order

      this.contact = order.contact

      this.review.orderId = orderId
      this.review.customer = order.for
      this.review.contactId = order.contactId
      this.review.staff = order.staff
    }

    this.reviewParams.forEach(param => {
      if (this.debug)
        this.review.params[param.code] = 5
      else
        this.review.params[param.code] = 0
    })

    if (order) {

      if (order.hasReviews()) {

        if (this.debug) {
          this.mode = ReviewMode.review
          this.review.feedback = 'Test feedback'
        }
        else
          this.mode = ReviewMode.alreadyReviewed // alreadyReviewed


      }
      else
        this.mode = ReviewMode.review

    } else {
      this.mode = ReviewMode.orderNotExisting
    }

  }

  async registerReviewOnContact(platform: ReviewPlatform) {

    /** keep track of reviews (by platform) on contact level  */
    let contact = this.contact

    if (!contact.rev)
      contact.rev = new ContactReviews()

    let contactReview = contact.rev.newReview(platform)

    let propertiesToUpdate = ['rev']

    if (platform === ReviewPlatform.internal) {
      contact.revDate = contactReview.last
      propertiesToUpdate.push('revDate')
    }

    await this.alteaDb.updateContact(contact, propertiesToUpdate)

  }


  async submit() {

    this.spinner.show()

    this.review.calculateRating()

    console.error(this.review)

    try {

      let res = await this.reviewSvc.create$(this.review)
      console.error(res)

      if (res.isOk) {

        await this.registerReviewOnContact(ReviewPlatform.internal)

        this.order.rev = ReviewStatus.completed
        await this.alteaDb.updateOrder(this.order, ['rev'])

        if (this.review.rating > 4.5)
          this.mode = ReviewMode.requestGoogleReview
        else
          this.mode = ReviewMode.finaliseReview

      }

      if (this.review.hasCustomFeedback())
        this.feedbackSaved = true

    } catch (err) {

      console.error(err)

    } finally {

      this.spinner.hide()

    }

  }

}
