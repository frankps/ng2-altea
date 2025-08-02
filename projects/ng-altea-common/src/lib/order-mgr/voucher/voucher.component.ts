import { Component } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { Order } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-voucher',
  templateUrl: './voucher.component.html',
  styleUrls: ['./voucher.component.css']
})
export class VoucherComponent {

  voucher: string
  voucherMessage = ''

  constructor(protected orderMgrSvc: OrderMgrUiService) {
  }

  get order(): Order { return this.orderMgrSvc.order }

  async removeVoucher(voucher: string) {
    this.orderMgrSvc.removeVoucher(voucher)
    this.voucherMessage = ''
  }

  async validateVoucher(voucher: string = null) {
    /* this.voucher = voucher
     this.voucherMessage = ''*/

     if (voucher) {
      this.voucher = voucher
     }


    const result = this.orderMgrSvc.addVoucher(this.voucher) 

    this.voucherMessage = result.message
    this.voucher = ''
  }


}
