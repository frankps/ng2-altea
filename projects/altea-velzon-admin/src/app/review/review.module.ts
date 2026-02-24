import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReviewRoutingModule } from './review-routing.module';
import { ReviewListComponent } from './review-list/review-list.component';
import { NgCommonModule } from 'ng-common';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    ReviewListComponent
  ],
  imports: [
    CommonModule,
    ReviewRoutingModule,
    NgCommonModule,
    NgbRatingModule
  ]
})
export class ReviewModule { }
