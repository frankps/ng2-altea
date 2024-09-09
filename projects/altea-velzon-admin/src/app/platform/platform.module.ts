import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlatformRoutingModule } from './platform-routing.module';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { UserListComponent } from './user-list/user-list.component';

import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { OrderDebugPageComponent } from './order-debug-page/order-debug-page.component';
import { NgAlteaCommonModule } from "../../../../ng-altea-common/src/lib/ng-altea-common.module";
import { OrderMgrModule } from "../../../../ng-altea-common/src/lib/order-mgr/order-mgr.module";

@NgModule({
  declarations: [
    ManageUsersComponent,
    EditUserComponent,
    UserListComponent,
    OrderDebugPageComponent],
  imports: [
    CommonModule,
    PlatformRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    NgAlteaCommonModule,
    NgxSpinnerModule,
    OrderMgrModule
  ]
})
export class PlatformModule { }
