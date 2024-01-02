import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Feather Icon
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { CountToModule } from 'angular-count-to';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgbDropdownModule, NgbNavModule, NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { SimplebarAngularModule } from 'simplebar-angular';
// Apex Chart Package
import { NgApexchartsModule } from 'ng-apexcharts';
// Swiper Slider
//import { NgxUsefulSwiperModule } from 'ngx-useful-swiper';
// Flat Picker
import { FlatpickrModule } from 'angularx-flatpickr';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastsContainer } from './dashboard/toasts-container.component';



@NgModule({
  declarations: [DashboardComponent, ToastsContainer],
  imports: [CommonModule, DashboardRoutingModule,
    FeatherModule.pick(allIcons),
 //   CountToModule,
    NgbToastModule,
    LeafletModule,
    NgbDropdownModule,
    NgbNavModule,
    SimplebarAngularModule,

    NgApexchartsModule,
 //   NgxUsefulSwiperModule,
    FlatpickrModule.forRoot(),
    NgbTypeaheadModule,
    NgbPaginationModule,
    FormsModule,
    ReactiveFormsModule
    // DashboardsRoutingModule,
    // SharedModule,
    // WidgetModule,
  ],
  exports: [ToastsContainer]
})
export class DashboardModule { }
