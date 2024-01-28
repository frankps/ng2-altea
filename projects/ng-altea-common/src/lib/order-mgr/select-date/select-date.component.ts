import { Component, EventEmitter, Output } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, SessionService } from 'ng-altea-common';
import { AlteaDb } from 'ts-altea-logic';
import { DateHelper } from 'ts-common';
import { NgxSpinnerService } from "ngx-spinner"

@Component({
  selector: 'order-mgr-select-date',
  templateUrl: './select-date.component.html',
  styleUrls: ['./select-date.component.scss'],
})
export class SelectDateComponent {

  @Output() selected: EventEmitter<Date> = new EventEmitter();

  bsInlineValue

  alteaDb: AlteaDb

  constructor(protected orderMgrUiSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected objectSvc: ObjectService, protected spinner: NgxSpinnerService) {

    this.alteaDb = new AlteaDb(objectSvc)

  }
 

  async dateChanged(event) {



    this.orderMgrUiSvc.from =  DateHelper.yyyyMMdd000000(event)
    
    console.error(this.orderMgrUiSvc.from)
    this.selected.emit(event)

    /*
    const res = await this.alteaDb.scheduleGetDefault('66E77BDB-A5F5-4D3D-99E0-4391BDED4C6C')
    console.error(res)
    */

    // this.orderMgrUiSvc.getPossibleDates()
    this.spinner.show()

    await this.orderMgrUiSvc.getAvailabilities()
 
    this.spinner.hide()


  }

}
