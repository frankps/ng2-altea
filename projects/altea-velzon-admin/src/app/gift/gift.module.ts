import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Generic imports
import { Bootstrap5Module } from 'ng-common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';

// Specific
import { GiftRoutingModule } from './gift-routing.module';
import { ManageGiftsComponent } from './manage-gifts/manage-gifts.component';
import { EditGiftComponent } from './edit-gift/edit-gift.component';
import { GiftListComponent } from './gift-list/gift-list.component';
import { NewGiftComponent } from './new-gift/new-gift.component';




@NgModule({
  declarations: [
    ManageGiftsComponent,
    EditGiftComponent,
    GiftListComponent,
    NewGiftComponent,
  ],
  imports: [CommonModule, GiftRoutingModule,
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
export class GiftModule { }
