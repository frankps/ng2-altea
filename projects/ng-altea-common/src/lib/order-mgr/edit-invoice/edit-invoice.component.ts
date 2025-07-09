import { Component, Input, OnInit } from '@angular/core';
import { BranchService, InvoiceService, OrderMgrUiService, SessionService } from 'ng-altea-common';
import { Branch, Invoice, Order } from 'ts-altea-model';
import { ArrayHelper, DateHelper, ObjectHelper } from 'ts-common';

@Component({
  selector: 'order-mgr-edit-invoice',
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.css']
})
export class EditInvoiceComponent implements OnInit {

  _invoice: Invoice = new Invoice()

  @Input() set invoice(invoice: Invoice) {
    this._invoice = invoice


  }

  get invoice(): Invoice {
    return this._invoice
  }


  //= new Invoice()

  @Input() branch: Branch

  existingInvoiceNum: string = ''

  order: Order

  constructor(private branchSvc: BranchService, private sessionSvc: SessionService, private invoiceSvc: InvoiceService, private orderMgrUiSvc: OrderMgrUiService) {

  }

  ngOnInit() {

    this.order = this.orderMgrUiSvc.order

  }

  useOrderInvoiceInfo() {
    let invoice = this.invoice

    if (!this.order.info['invoice'])
      return

    let invoiceInfo = this.order.info['invoice']

    if (invoiceInfo.company)
      invoice.company = invoiceInfo.company

    if (invoiceInfo.vatNum)
      invoice.vatNum = invoiceInfo.vatNum

    if (invoiceInfo.address)
      invoice.address = invoiceInfo.address

    if (invoiceInfo.email)
      invoice.email = invoiceInfo.email

    // invoice.mobile = this.order.info.mobile

    // this.invoice = invoice
  }

  checkDate() {

    console.log('CHECK DATE')
    if (ArrayHelper.IsEmpty(this.invoice.orders)) {
      console.log('Invoice has no associated orders...')
      return
    }


    let order = this.invoice.orders[0]

    if (order.gift || !order.start) {
      this.invoice.date = DateHelper.yyyyMMdd(order.cre)
    } else if (order.start) {
      let start = order.startDate
      this.invoice.date = DateHelper.yyyyMMdd(start)
    }

    console.log('invoice.date: ')
    console.log(this.invoice.date)

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

    let num = '0000' + this.branch.inv.next

    num = num.slice(-3)

    this.invoice.num = `${this.branch.inv.year}.${num}`


    this.branch.inv.next++
    this.branch.markAsUpdated('inv')

    const res = await this.branchSvc.update$(this.branch)

    console.log(res)

  }
}
