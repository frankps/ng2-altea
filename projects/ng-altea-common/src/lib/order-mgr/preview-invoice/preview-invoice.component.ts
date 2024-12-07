import { Component, Input } from '@angular/core';
import { Branch, Invoice } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-preview-invoice',
  templateUrl: './preview-invoice.component.html',
  styleUrls: ['./preview-invoice.component.css']
})
export class PreviewInvoiceComponent {

  @Input() invoice: Invoice 
  @Input() branch: Branch
}
