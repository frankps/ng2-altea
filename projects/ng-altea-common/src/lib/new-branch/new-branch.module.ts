import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewBranchRoutingModule } from './new-branch-routing.module';
import { CreateBranchComponent } from './create-branch/create-branch.component';

import { NgCommonModule } from 'ng-common';
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ClipboardModule } from '@angular/cdk/clipboard';


@NgModule({
  declarations: [
    CreateBranchComponent
  ],
  imports: [
    CommonModule,
    NewBranchRoutingModule,
    NgCommonModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    ClipboardModule,
  ],
  exports: [
    CreateBranchComponent
  ]
})
export class NewBranchModule { }
