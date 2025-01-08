import { Component, Input } from '@angular/core';
import { BranchService, InvoiceService, OrderMgrUiService, SessionService } from 'ng-altea-common';
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

  constructor(private branchSvc: BranchService, private sessionSvc: SessionService, private invoiceSvc: InvoiceService, private orderMgrUiSvc: OrderMgrUiService) {

  } 

  async addToExistingInvoiceNum(existingInvoiceNum: string) {

    console.error(existingInvoiceNum)


    if (!existingInvoiceNum)
      return

    let branchId = this.sessionSvc.branchId

    let invoice = await this.invoiceSvc.getByNum$(branchId, existingInvoiceNum)

    if (!invoice) {
      return
    }

    let order = this.orderMgrUiSvc.order

    order.invoiceNum = invoice.num
    order.invoiceId = invoice.id
    order.invoiced = true


    order.markAsUpdated('invoiceNum', 'invoiceId', 'invoiced')
    this.orderMgrUiSvc.orderDirty = true


    invoice.orders.push(order)

    invoice.updateFromOrders()

    var saveOrderRes = await this.orderMgrUiSvc.saveOrder()
    console.log(saveOrderRes)

    this.orderMgrUiSvc.invoice = invoice


    var saveInvoiceRes = await this.invoiceSvc.update$(invoice)
    console.warn(saveInvoiceRes)

    console.log(invoice)

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
