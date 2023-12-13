import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GiftListComponent } from './gift-list/gift-list.component';
import { EditGiftComponent } from './edit-gift/edit-gift.component';
import { ManageGiftsComponent } from './manage-gifts/manage-gifts.component';

const routes: Routes = [
  { path: "mobile/", component: GiftListComponent },
  { path: "mobile/:id", component: EditGiftComponent },
  {
    path: "", component: ManageGiftsComponent, children: [
      { path: ":id", component: EditGiftComponent },
      { path: "new/", component: EditGiftComponent },
    ]
  },
  { path: "manage", component: ManageGiftsComponent },
  { path: "list", component: GiftListComponent },
];

//const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GiftRoutingModule { }
