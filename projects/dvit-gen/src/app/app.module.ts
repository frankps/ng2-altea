import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Ngbs5Component } from './ngbs5/ngbs5.component';
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
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    Ngbs5Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    Bootstrap5Module,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
