import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { NxWelcomeComponent } from './nx-welcome.component';
import { LayoutsModule } from './velzon/layouts/layouts.module';
//import { DashboardModule } from './velzon/dashboard/dashboard.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { nlBeLocale } from 'ngx-bootstrap/locale';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { NgxSpinnerModule } from "ngx-spinner"
import { Bootstrap5Module } from  'ng-common'  // 'ng-common' 
import { FullCalendarModule } from '@fullcalendar/angular';
import { DemoComponent } from './demo/demo/demo.component';
import { ContactModule } from './contact/contact.module';
import { environment } from '../environments/environment';

import { FakeBackendInterceptor } from './velzon/core/helpers/fake-backend';
import { initFirebaseBackend } from './velzon/authUtils';
import { InterfaceModule, NgAlteaCommonModule, SessionService } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';
import { NgSelectModule } from '@ng-select/ng-select';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { ScheduleModule } from '@syncfusion/ej2-angular-schedule';
import {NgIdleModule} from '@ng-idle/core'
import { NgxEditorModule } from 'ngx-editor'
import { FormsModule } from '@angular/forms';
import { ProductModule } from "./product/product.module";
//import { RichTextEditorModule } from '@syncfusion/ej2-angular-richtexteditor';


defineLocale('nl-be', nlBeLocale);

export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  FakeBackendInterceptor;
}

@NgModule({
  declarations: [AppComponent, NxWelcomeComponent, DemoComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    FeatherModule.pick(allIcons),
    HttpClientModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    //    OrderMgrModule,
    NgxSpinnerModule,
    Bootstrap5Module,
    NgSelectModule,
    FormsModule,
    FullCalendarModule,
    TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient],
        },
    }),
    ContactModule,
    NgAlteaCommonModule,
    InterfaceModule,
    ScheduleModule,
    NgIdleModule.forRoot()
],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {

  constructor(protected sessionSvc: SessionService) {

    console.log('AppModule Init')
    console.warn(environment)
    sessionSvc.init(environment)
  }

  
}


/*
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
*/