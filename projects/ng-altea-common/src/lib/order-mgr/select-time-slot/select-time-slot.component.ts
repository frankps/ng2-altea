import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';

@Component({
  selector: 'order-mgr-select-time-slot',
  templateUrl: './select-time-slot.component.html',
  styleUrls: ['./select-time-slot.component.scss'],
})
export class SelectTimeSlotComponent {

  constructor(protected orderMgrSvc: OrderMgrUiService) {

  }

}
