import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignOutComponent } from './sign-out/sign-out.component';
import { ContactComponent } from './contact/contact.component';
import { UserComponent } from './user/user.component';

const routes: Routes = [
  { path: "sign-in", component: SignInComponent },
  { path: "sign-out", component: SignOutComponent },
  { path: "profile", component: UserComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
