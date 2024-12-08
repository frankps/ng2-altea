import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OnboardingRoutingModule } from './onboarding-routing.module';
import { NewBusinessComponent } from './new-business/new-business.component';
import { NewBranchModule } from 'ng-altea-common';

@NgModule({
  declarations: [
    NewBusinessComponent
  ],
  imports: [
    CommonModule,
    OnboardingRoutingModule,
    NewBranchModule  

  ]
})
export class OnboardingModule { }
