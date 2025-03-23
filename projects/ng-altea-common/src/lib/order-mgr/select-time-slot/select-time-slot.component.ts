import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ReservationOption } from 'ts-altea-model';
import { SessionService } from 'ng-altea-common';
import * as _ from "lodash"
import * as dateFns from 'date-fns'

@Component({
  selector: 'order-mgr-select-time-slot',
  templateUrl: './select-time-slot.component.html',
  styleUrls: ['./select-time-slot.component.scss'],
})
export class SelectTimeSlotComponent {

  debug = false

  @Output() changeDate: EventEmitter<void> = new EventEmitter<void>();

  @Output() selected: EventEmitter<ReservationOption> = new EventEmitter<ReservationOption>();

  @Input() otherDateButton: boolean = true

  message: string = ""


  isPosAdmin: boolean
  forceTime: string = "15:00"

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService) {

  }

  ngOnInit() {
    const from = this.orderMgrSvc.availabilityRequestFromDate()

    console.error('From date: ', from)

    this.isPosAdmin = this.sessionSvc.isPosAdmin()

  }

  selectOtherDate() {
    this.changeDate.emit()
  }

  editOrder() {
    this.orderMgrSvc.changeUiState('order')
  }

  async customTimeSlot() {

    let date = this.orderMgrSvc.availabilityRequestFromDate()

    console.warn(this.forceTime)
  
    let timeItems = this.forceTime.split(':')
    let hour = 0, minute = 0

    if (timeItems.length == 2) {
      hour = + timeItems[0]
      minute = + timeItems[1]
    }

    date = dateFns.addHours(date, hour)
    date = dateFns.addMinutes(date, minute)
  
    console.log(date)

    let customOption = ReservationOption.fromDate(date)
    var res = await this.selectTimeSlot(customOption)

  }

  async selectTimeSlot(option: ReservationOption) {

    this.message = ""

    var res = await this.orderMgrSvc.selectTimeSlot(option)

    if (res?.isOk)
      this.selected.emit(option)
    else {
      this.message = res.message
    }



  }




  test() {
    this.orderMgrSvc.hasOptions()
  }
}
