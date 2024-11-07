import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactRoutingModule } from './contact-routing.module';
import { ManageContactsComponent } from './manage-contacts/manage-contacts.component';
import { EditContactComponent } from './edit-contact/edit-contact.component';
import { ContactListComponent } from './contact-list/contact-list.component';
import { NewContactComponent } from './new-contact/new-contact.component';
import { SearchContactComponent } from './search-contact/search-contact.component';

import { Bootstrap5Module, NgCommonModule } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgAlteaCommonModule, OrderMgrModule } from 'ng-altea-common';



@NgModule({
  exports: [
    SearchContactComponent
  ],
  declarations: [
    ManageContactsComponent,
    EditContactComponent,
    ContactListComponent,
    NewContactComponent,
    SearchContactComponent,
  ],
  imports: [CommonModule, 
    ContactRoutingModule,
    NgbModule,
    Bootstrap5Module,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    ModalModule,
    BsDatepickerModule,
    TimepickerModule,
    NgxSpinnerModule,
    NgCommonModule,
    NgAlteaCommonModule
  ]
})
export class ContactModule {}
