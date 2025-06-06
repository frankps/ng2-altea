import { NgModule, isDevMode } from '@angular/core';
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
import { NgAlteaCommonModule, SessionService } from 'ng-altea-common';
import { OrderMgrModule } from 'ng-altea-common';
import { OrderComponent } from './branch/order/order.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';


defineLocale('nl-be', nlBeLocale);

export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
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
    NgAlteaCommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { 

  constructor(protected sessionSvc: SessionService) {
    sessionSvc.init(environment)
  }


}
