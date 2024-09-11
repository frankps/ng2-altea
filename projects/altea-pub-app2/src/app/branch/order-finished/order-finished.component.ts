import { Component } from '@angular/core';
import { OrderMgrUiService } from 'ng-altea-common';

@Component({
  selector: 'app-order-finished',
  templateUrl: './order-finished.component.html',
  styleUrls: ['./order-finished.component.scss']
})
export class OrderFinishedComponent {

  constructor(protected orderMgrSvc: OrderMgrUiService) {
    
  }

}
