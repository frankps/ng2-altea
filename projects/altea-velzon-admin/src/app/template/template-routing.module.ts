import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageTemplatesComponent } from './manage-templates/manage-templates.component';
import { TemplateType } from 'ts-altea-model'

const routes: Routes = [
  { path: "", component: ManageTemplatesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TemplateRoutingModule { 

  

}
