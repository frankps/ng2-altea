import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactListComponent } from './contact-list/contact-list.component';
import { EditContactComponent } from './edit-contact/edit-contact.component';
import { ManageContactsComponent } from './manage-contacts/manage-contacts.component';

const routes: Routes = [
  { path: "mobile/", component: ContactListComponent},
  { path: "mobile/:id", component: EditContactComponent},
  { path: "", component: ManageContactsComponent,  children: [
    { path: ":id", component: EditContactComponent },
    { path: "new/", component: EditContactComponent },
  ] }, 
  { path: "manage", component: ManageContactsComponent },
  { path: "list", component: ContactListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule { }




/*

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule { }


*/


