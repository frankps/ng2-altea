import { Component, ViewChild } from '@angular/core';
import { Contact } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {


  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;


  selectedContact?: Contact

  setContact(contact: Contact) {

    this.selectedContact = contact

  }


  searchWithModal() {

    this.searchContactModal.show()



  }
}
