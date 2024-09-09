import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { OrderDebugPageComponent } from './order-debug-page/order-debug-page.component';

const routes: Routes = [
  {
    path: "users", children:
      [{ path: "mobile/", component: UserListComponent },
      { path: "mobile/:id", component: EditUserComponent },
      {
        path: "", component: ManageUsersComponent, children: [
          { path: ":id", component: EditUserComponent },
          { path: "new/", component: EditUserComponent },
        ]
      },
      { path: "manage", component: ManageUsersComponent },
      { path: "list", component: UserListComponent }]
  },
  { path: "order-debug", component: OrderDebugPageComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlatformRoutingModule { }
