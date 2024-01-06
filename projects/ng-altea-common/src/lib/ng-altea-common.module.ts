import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RequestGiftComponent } from './gift/request-gift/request-gift.component';
import { TranslateModule } from '@ngx-translate/core';
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule,
  HttpClientModule,
  TranslateModule,
  Bootstrap5Module,
  FormsModule
],
  declarations: [
    RequestGiftComponent
  ],
  exports: [
    RequestGiftComponent
  ]
})
export class NgAlteaCommonModule {}
