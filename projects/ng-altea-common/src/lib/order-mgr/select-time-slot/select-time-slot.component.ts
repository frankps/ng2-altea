import { Component, Output, EventEmitter, OnInit } from '@angular/core';
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

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

  selectOtherDate() {
    this.changeDate.emit()
  }


  async selectTimeSlot(option: ReservationOption) {

    if (!this.debug)
      await this.orderMgrSvc.selectTimeSlot(option)

    this.selected.emit(option)
  }
}
