
import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Invoice, Country } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'


@Component({
  selector: 'altea-lib-request-invoice',
  templateUrl: './request-invoice.component.html',
  styleUrls: ['./request-invoice.component.css']
})
export class RequestInvoiceComponent{  //  implements OnInit 


	invoice: Invoice= new Invoice()
	css_cls_row= 'mt-3'
	initialized= false
	@ViewChild('requestInvoiceForm')
	requestInvoiceForm: NgForm
	country: Translation[]= []
	@Output()
	request: EventEmitter<Invoice>= new EventEmitter<Invoice>()

	invoiceNeeded: boolean = true

	constructor(protected translationSvc: TranslationService) {

	}

	async ngOnInit() {
		await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
		this.initialized = true
	}

	save(invoice) {
		console.warn("Button 'request' clicked: 'save' method triggered!")
		console.warn(this.invoice)
		this.request.emit(this.invoice)
	}


}
