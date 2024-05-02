import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoyaltyProgramListComponent } from './loyalty-program-list/loyalty-program-list.component';
import { EditLoyaltyProgramComponent } from './edit-loyalty-program/edit-loyalty-program.component';
import { ManageLoyaltyProgramsComponent } from './manage-loyalty-programs/manage-loyalty-programs.component';

const routes: Routes = [
  { path: "mobile/", component: LoyaltyProgramListComponent },
  { path: "mobile/:id", component: EditLoyaltyProgramComponent },
  {
    path: "", component: ManageLoyaltyProgramsComponent, children: [
      { path: ":id", component: EditLoyaltyProgramComponent },
      { path: "new/", component: EditLoyaltyProgramComponent },
    ]
  },
  { path: "manage", component: ManageLoyaltyProgramsComponent },
  { path: "list", component: LoyaltyProgramListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoyaltyRoutingModule { }
