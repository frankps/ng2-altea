import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ReservationOption } from 'ts-altea-model';

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

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

  ngOnInit() {
    const from = this.orderMgrSvc.availabilityRequestFromDate()

    console.error('From date: ', from)

  }

  selectOtherDate() {
    this.changeDate.emit()
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
