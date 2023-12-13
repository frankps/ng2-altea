import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, SessionService } from 'ng-altea-common';
import { AlteaDb } from 'ts-altea-logic';
import { DateHelper } from 'ts-common';


@Component({
  selector: 'order-mgr-select-date',
  templateUrl: './select-date.component.html',
  styleUrls: ['./select-date.component.scss'],
})
export class SelectDateComponent {

  bsInlineValue = new Date();


  alteaDb: AlteaDb

  constructor(protected orderMgrUiSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected objectSvc: ObjectService) {

    this.alteaDb = new AlteaDb(objectSvc)

  }


  async dateChanged(event) {



    this.orderMgrUiSvc.from =  DateHelper.yyyyMMdd000000(event)
    
    console.error(this.orderMgrUiSvc.from)


    const res = await this.alteaDb.scheduleGetDefault('66E77BDB-A5F5-4D3D-99E0-4391BDED4C6C')

    console.error(res)
    // this.orderMgrUiSvc.getPossibleDates()
  }

}
