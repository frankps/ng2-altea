import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from 'ngx-bootstrap/modal';

import { Bootstrap5RoutingModule } from './bootstrap5-routing.module';
import { FormCardSectionComponent } from './form-card-section/form-card-section.component';
import { LabelControlComponent } from './label-control/label-control.component';
import { LabelValueComponent } from './label-value/label-value.component';
import { NgxModalComponent } from './ngx-modal/ngx-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { RadioListComponent } from './radio-list/radio-list.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DeleteModalComponent } from './delete-modal/delete-modal.component';
import { ToastsComponent } from './toasts/toasts.component';
import { NgbModule, NgbToastModule  } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    FormCardSectionComponent,
    LabelControlComponent,
    LabelValueComponent,
    NgxModalComponent,
    RadioListComponent,
    DeleteModalComponent,
    ToastsComponent,
  ],
  imports: [
    CommonModule,
    Bootstrap5RoutingModule,
    ModalModule,
    TranslateModule,
    NgbPopoverModule,
    FormsModule,
    NgSelectModule,
    NgbModule,
    NgbToastModule
  ],
  exports: [
    FormCardSectionComponent,
    LabelControlComponent,
    LabelValueComponent,
    RadioListComponent,
    NgxModalComponent,
    DeleteModalComponent,
    ToastsComponent
  ],
})
export class Bootstrap5Module {}
