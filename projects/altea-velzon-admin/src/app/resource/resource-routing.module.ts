import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageResourcesComponent } from './manage-resources/manage-resources.component';
import { EditResourceComponent } from './edit-resource/edit-resource.component';
import { ResourceListComponent } from './resource-list/resource-list.component';




const routes: Routes = [
  { path: "mobile/:type", component: ResourceListComponent},
  { path: "mobile/:type/:id", component: EditResourceComponent},
  { path: ":type", component: ManageResourcesComponent,  children: [
    { path: ":id", component: EditResourceComponent },
    { path: "new/:type", component: EditResourceComponent },
  ] }, 

  { path: "manage", component: ManageResourcesComponent },
  { path: "list", component: ResourceListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourceRoutingModule { }
