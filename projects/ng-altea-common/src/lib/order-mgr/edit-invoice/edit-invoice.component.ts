import { Component, Input } from '@angular/core';
import { BranchService, InvoiceService, OrderMgrUiService } from 'ng-altea-common';
import { Branch, Invoice } from 'ts-altea-model';
import { ObjectHelper } from 'ts-common';

@Component({
  selector: 'order-mgr-edit-invoice',
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.css']
})
export class EditInvoiceComponent {

  @Input() invoice: Invoice = new Invoice()

  @Input() branch: Branch

  existingInvoiceNum: string = ''

  constructor(private branchSvc: BranchService, private invoiceSvc: InvoiceService, private orderMgrUiSvc: OrderMgrUiService) {

  } 

  async addToExistingInvoiceNum(existingInvoiceNum: string) {

    console.error(existingInvoiceNum)

    //orderMgrUiSvc
  }

  async assignInvoiceNum() {

    let num =  '0000' + this.branch.inv.next

    num = num.slice(-3)

    this.invoice.num = `${this.branch.inv.year}.${num}`


    this.branch.inv.next++
    this.branch.markAsUpdated('inv')

    const res = await this.branchSvc.update$(this.branch)

    console.log(res)

  }
}
