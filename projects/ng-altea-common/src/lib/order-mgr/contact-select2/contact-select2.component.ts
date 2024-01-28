import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { Branch, Contact, Country } from 'ts-altea-model'
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'
import { ContactService, SessionService } from 'ng-altea-common';
import { OrderMgrUiService } from '../order-mgr-ui.service';

@Component({
  selector: 'order-mgr-contact-select2',
  templateUrl: './contact-select2.component.html',
  styleUrls: ['./contact-select2.component.css']
})
export class ContactSelect2Component {

  @Output() selected: EventEmitter<Contact> = new EventEmitter<Contact>();

	contact: Contact= new Contact()
	css_cls_row= 'mt-3'
	initialized= false
	@ViewChild('contactForm')
	contactForm: NgForm
	country: Translation[]= []

  contacts: Contact[]
  branch: Branch

  translateParam //= { company: ''}

  showContacts = false

	constructor(protected translationSvc: TranslationService, private contactSvc: ContactService
    , protected orderMgrSvc: OrderMgrUiService, private sessionSvc: SessionService) {

      

	}
  
  demoData() {
/*
sandra.enghien@gmail.com
0493152231
sandra enghien
*/
    this.contact.first = 'sandra'
    this.contact.last = 'enghien2'
    this.contact.mobile = '0493152231'
    this.contact.email = 'sandra.enghien@gmail.com'
  }
   
	async ngOnInit() {
		await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)

    this.branch = await this.sessionSvc.branch$()

    this.translateParam = { company: this.branch.name} 
    console.log(this.translateParam)

    this.demoData()

		this.initialized = true
	}



	confirm($event) {
		console.warn("Button 'request' clicked: 'confirm' method triggered!")
		console.warn(this.contact)
	}

  async searchContact() {

    this.contact.setName()  // to show correctly for new contact

    this.contacts = await this.contactSvc.search$(this.contact.first)

    this.showContacts = true

  }

  selectContact(contact: Contact) {

    console.log(contact)

    this.orderMgrSvc.setContact(contact)
    this.selected.emit(contact)
  }

  async createAsNew() {

    this.contact.branchId = this.branch.id
    this.contact.setName()

    const res = await this.contactSvc.create$(this.contact)
    console.warn(res)

    if (res.isOk) {
      this.selectContact(res.object)
    }

  }

  editContact() {
    this.showContacts = false
    this.contacts = []
  }

}



