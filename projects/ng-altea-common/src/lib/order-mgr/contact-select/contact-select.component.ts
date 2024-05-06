import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { ContactService } from 'ng-altea-common';
import { Contact } from 'ts-altea-model';
import { OrderMgrUiService } from '../order-mgr-ui.service';


@Component({
  selector: 'order-mgr-contact-select',
  templateUrl: './contact-select.component.html',
  styleUrls: ['./contact-select.component.scss']
})
export class ContactSelectComponent {

  search: string = ''
  contacts: Contact[]

  @Output() select: EventEmitter<Contact> = new EventEmitter<Contact>();

  constructor(private contactSvc: ContactService, protected orderMgrSvc: OrderMgrUiService) {

  }

  async searchContact() {

    console.error(this.search)

    this.contacts = await this.contactSvc.searchByString$(this.search)

    console.log(this.contacts)
  }

  async selectContact(contact: Contact) {

    if (!contact?.id)
      return

    contact = await this.contactSvc.getById$(contact.id, 'cards')

    console.log(contact)

    this.orderMgrSvc.setContact(contact)
    this.select.emit(contact)

  }



}
