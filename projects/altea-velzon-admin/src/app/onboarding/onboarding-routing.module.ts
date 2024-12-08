import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewBusinessComponent } from './new-business/new-business.component';

const routes: Routes = [
  { path: "", component: NewBusinessComponent },
  { path: "new", component: NewBusinessComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnboardingRoutingModule { }
