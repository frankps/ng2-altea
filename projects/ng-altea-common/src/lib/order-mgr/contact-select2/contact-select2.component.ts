import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core'
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

  _contact: Contact= new Contact()


	@Input() set contact(value: Contact) {
    this._contact = value
    this.isNew = false
  }

  get contact() {
    return this._contact
  }


  isNew = true

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

    let me = this

    me.contact.setName()  // to show correctly for new contact

    me.contacts = await me.contactSvc.searchContacts$(me.contact)

    console.log(me.contacts)

    me.showContacts = true

  }

  async updateContact() {
    let me = this

    let res = await me.contactSvc.update$(me.contact)
  }


  contactsFound() {
    return Array.isArray(this.contacts) && this.contacts.length > 0
  }

  selectContact(contact: Contact) {

    this.contact = contact
    this.isNew = false
    this.showContacts = false
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



