import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Generic imports
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';

import { LoyaltyRoutingModule } from './loyalty-routing.module';
import { ManageLoyaltyProgramsComponent } from './manage-loyalty-programs/manage-loyalty-programs.component';
import { EditLoyaltyProgramComponent } from './edit-loyalty-program/edit-loyalty-program.component';
import { LoyaltyProgramListComponent } from './loyalty-program-list/loyalty-program-list.component';
import { ProductModule } from '../product/product.module';
import { LoyaltyRewardComponent } from './loyalty-reward/loyalty-reward.component';


@NgModule({
  declarations: [
    ManageLoyaltyProgramsComponent,
    EditLoyaltyProgramComponent,
    LoyaltyProgramListComponent,
    LoyaltyRewardComponent
  ],
  imports: [
    CommonModule,
    LoyaltyRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    ProductModule
  ]
})
export class LoyaltyModule { }
