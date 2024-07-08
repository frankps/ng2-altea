import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/branch/aqua/menu', pathMatch: 'full' },
  { path: 'branch', loadChildren: () => import('./branch/branch.module').then(m => m.BranchModule)  }, 
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)  },
  { path: 'info', loadChildren: () => import('./info/info.module').then(m => m.InfoModule)  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
