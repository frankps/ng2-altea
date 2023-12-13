import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubscriptionListComponent } from './subscription-list/subscription-list.component';
import { EditSubscriptionComponent } from './edit-subscription/edit-subscription.component';
import { ManageSubscriptionsComponent } from './manage-subscriptions/manage-subscriptions.component';

const routes: Routes = [
  { path: "mobile/", component: SubscriptionListComponent },
  { path: "mobile/:id", component: EditSubscriptionComponent },
  {
    path: "", component: ManageSubscriptionsComponent, children: [
      { path: ":id", component: EditSubscriptionComponent },
      { path: "new/", component: EditSubscriptionComponent },
    ]
  },
  { path: "manage", component: ManageSubscriptionsComponent },
  { path: "list", component: SubscriptionListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SubscriptionRoutingModule { }
