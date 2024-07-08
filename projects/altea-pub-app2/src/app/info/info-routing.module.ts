import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrivacyComponent } from './privacy/privacy.component';
import { UserDataDeletionComponent } from './user-data-deletion/user-data-deletion.component';

const routes: Routes = [
  { path: "privacy", component: PrivacyComponent },
  { path: "user-data-deletion", component: UserDataDeletionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InfoRoutingModule { }
