import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignOutComponent } from './sign-out/sign-out.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { ContactComponent } from './contact/contact.component';
import { UserComponent } from './user/user.component'
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgCommonModule } from 'ng-common';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Bootstrap5Module } from 'ng-common';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { EmailPasswdComponent } from './email-passwd/email-passwd.component'

@NgModule({
  declarations: [
    SignInComponent,
    SignOutComponent,
    ContactComponent,
    UserComponent,
    EmailPasswdComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    NgCommonModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    NgxSpinnerModule,
    ClipboardModule
    
  ],
  exports: [
    SignInComponent,
    EmailPasswdComponent,
    UserComponent
  ]
})
export class AuthModule { }
