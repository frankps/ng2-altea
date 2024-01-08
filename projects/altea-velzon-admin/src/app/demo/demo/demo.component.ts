import { Component, ViewChild } from '@angular/core';
import { Contact } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { ObjectService } from 'ng-altea-common';
import { CheckDeposists } from 'ts-altea-logic';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {


  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;


  selectedContact?: Contact

  constructor(public dbSvc: ObjectService) {


  }


  setContact(contact: Contact) {

    this.selectedContact = contact

  }


  searchWithModal() {

    this.searchContactModal.show()

  }


  cancelExpiredDeposists() {

    const checkDeposits = new CheckDeposists(this.dbSvc)

    checkDeposits.cancelExpiredDeposists()


  }


  menuClicked(menuCode) {

    console.error(menuCode)

  }

}
