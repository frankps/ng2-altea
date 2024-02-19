import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuComponent } from './branch/menu/menu.component';
import { OrderComponent } from './branch/order/order.component';
import { authGuard } from './auth/auth.guard';
// import { SignInComponent } from './auth/sign-in/sign-in.component';

const routes: Routes = [
  { path: "", component: MenuComponent },   // , canActivate: [ authGuard]
 // { path: "signIn", component: SignInComponent },
  { path: 'branch', loadChildren: () => import('./branch/branch.module').then(m => m.BranchModule)  },   // , canActivate: [ authGuard]
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
