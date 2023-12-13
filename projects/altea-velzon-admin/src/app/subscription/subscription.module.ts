import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubscriptionRoutingModule } from './subscription-routing.module';
import { ManageSubscriptionsComponent } from './manage-subscriptions/manage-subscriptions.component';
import { EditSubscriptionComponent } from './edit-subscription/edit-subscription.component';
import { SubscriptionListComponent } from './subscription-list/subscription-list.component';
import { NewSubscriptionComponent } from './new-subscription/new-subscription.component';

import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';

@NgModule({
  declarations: [
    ManageSubscriptionsComponent,
    EditSubscriptionComponent,
    SubscriptionListComponent,
    NewSubscriptionComponent,
  ],
  imports: [CommonModule, SubscriptionRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule],
})
export class SubscriptionModule { }
