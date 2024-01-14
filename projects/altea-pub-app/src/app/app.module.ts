import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from "ngx-spinner"
import { Bootstrap5Module } from  'ng-common' 
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { nlBeLocale } from 'ngx-bootstrap/locale';
import { NgAlteaCommonModule } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';
import { OrderComponent } from './order/order.component';

defineLocale('nl-be', nlBeLocale);

export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    OrderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    Bootstrap5Module,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    NgAlteaCommonModule,
    OrderMgrModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
