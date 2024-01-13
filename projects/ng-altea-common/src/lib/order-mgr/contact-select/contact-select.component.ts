import { Component } from '@angular/core';
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

  constructor(private contactSvc: ContactService, protected orderMgrSvc: OrderMgrUiService) {

  }

  async searchContact() {

    console.error(this.search)

    this.contacts = await this.contactSvc.search$(this.search)

    console.log(this.contacts)
  }

  selectContact(contact: Contact) {

    console.log(contact)

    this.orderMgrSvc.setContact(contact)

  }



}
