import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Bootstrap5Module } from './bootstrap5/bootstrap5.module';
import { NgxModalComponent } from './bootstrap5/ngx-modal/ngx-modal.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { IntdatePipe } from './pipes/intdate.pipe';
import { TimePickerComponent } from './controls/time-picker/time-picker.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    Bootstrap5Module,
    ModalModule,
    FormsModule,
    LayoutModule,
    NgSelectModule
  ],
  declarations: [IntdatePipe, TimePickerComponent],
  exports: [NgxModalComponent, IntdatePipe, TimePickerComponent],
})
export class NgCommonModule { }
