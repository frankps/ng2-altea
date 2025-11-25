import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, SessionService } from 'ng-altea-common';
import { AlteaDb } from 'ts-altea-logic';
import { ArrayHelper, DateHelper } from 'ts-common';
import { NgxSpinnerService } from "ngx-spinner"
import * as dateFns from 'date-fns'
import { DatepickerDateCustomClasses } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'order-mgr-select-date',
  templateUrl: './select-date.component.html',
  styleUrls: ['./select-date.component.scss'],
})
export class SelectDateComponent implements OnInit {


  @Output() selected: EventEmitter<Date> = new EventEmitter();

  bsInlineValue

  alteaDb: AlteaDb

  // for debugging
  minDate = new Date()  //new Date(2024, 2, 1)

  dateCustomClasses: DatepickerDateCustomClasses[] = []

  init = false

  orderSummary: string = ''

  constructor(protected orderMgrUiSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected objectSvc: ObjectService, protected spinner: NgxSpinnerService) {

    this.alteaDb = new AlteaDb(objectSvc)



  }

  ngOnInit(): void {

    if (this.sessionSvc.isPosAdmin()) {
      this.minDate = null
      //this.bsInlineValue = new Date()
      const now = new Date()

      this.dateCustomClasses = [
        { date: now, classes: ['bg-warning'] }
      ]
    }

    if (this.orderMgrUiSvc.showOrderSummaryPlanning) {
      let order = this.orderMgrUiSvc.order
      console.error('Order:', order)

      let productDescriptions = order.lines?.map(line => line.product?.descr).filter(descr => descr != null && descr.trim() != '')

      if (ArrayHelper.NotEmpty(productDescriptions))
        this.orderSummary = productDescriptions.join(', ')
    }

    this.init = true
  }


  async dateChanged(event) {

    if (!this.init) {
      return
    }


    this.orderMgrUiSvc.from = DateHelper.yyyyMMdd000000(event)

    console.error(this.orderMgrUiSvc.from)
 

    /*
    const res = await this.alteaDb.scheduleGetDefault('66E77BDB-A5F5-4D3D-99E0-4391BDED4C6C')
    console.error(res)
    */

    // this.orderMgrUiSvc.getPossibleDates()
    this.spinner.show()

    await this.orderMgrUiSvc.getAvailabilities()

    this.selected.emit(event)

    this.spinner.hide()


  }

}
