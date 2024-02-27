import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuComponent } from './branch/menu/menu.component';
import { OrderComponent } from './branch/order/order.component';
import { authGuard } from './auth/auth.guard';
// import { SignInComponent } from './auth/sign-in/sign-in.component';

const routes: Routes = [
 // { path: "", component: MenuComponent, canActivate: [ authGuard] },   // , canActivate: [ authGuard]
 // { path: "signIn", component: SignInComponent },
  { path: '', redirectTo: '/staff/dashboard', pathMatch: 'full' },
  { path: 'branch', loadChildren: () => import('./branch/branch.module').then(m => m.BranchModule), canActivate: [ authGuard]  },   // , canActivate: [ authGuard]
  { path: 'staff', loadChildren: () => import('./staff/staff.module').then(m => m.StaffModule), canActivate: [ authGuard]  },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
