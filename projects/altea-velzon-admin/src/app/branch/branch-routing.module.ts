import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditBranchComponent } from './edit-branch/edit-branch.component';

const routes: Routes = [
  { path: "", component: EditBranchComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
