import { Component, Input } from '@angular/core';
import { Invoice } from 'projects/ts-altea-model/src/lib/schema/invoice';

@Component({
  selector: 'edit-invoice',
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.scss']
})
export class EditInvoiceComponent {

  @Input() invoice: Invoice = new Invoice()

}
