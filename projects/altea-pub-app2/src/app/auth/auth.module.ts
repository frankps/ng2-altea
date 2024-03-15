import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignOutComponent } from './sign-out/sign-out.component';
import { NgxSpinnerModule } from "ngx-spinner"


@NgModule({
  declarations: [
    SignInComponent,
    SignOutComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    NgxSpinnerModule
  ]
})
export class AuthModule { }
