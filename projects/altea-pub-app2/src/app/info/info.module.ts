import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InfoRoutingModule } from './info-routing.module';
import { PrivacyComponent } from './privacy/privacy.component';
import { UserDataDeletionComponent } from './user-data-deletion/user-data-deletion.component';


@NgModule({
  declarations: [
    PrivacyComponent,
    UserDataDeletionComponent
  ],
  imports: [
    CommonModule,
    InfoRoutingModule
  ]
})
export class InfoModule { }
