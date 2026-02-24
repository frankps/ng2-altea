import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReviewListComponent } from './review-list/review-list.component';

const routes: Routes = [
  { path: "list", component: ReviewListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReviewRoutingModule { }
