import { Component, ViewChild } from '@angular/core';
import { Contact } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { ObjectService } from 'ng-altea-common';
import { CheckDeposists } from 'ts-altea-logic';
import { TranslationService } from 'ng-common'
import { Country } from 'ts-altea-model'
import { Translation } from 'ts-common';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {


  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;
 
	country: Translation[] = []
  countries: Translation[] = []

  css_cls_row = 'mt-3'

  selectedContact?: Contact

  constructor(public dbSvc: ObjectService, protected translationSvc: TranslationService) {

    

  }

  async ngOnInit() {
    await this.translationSvc.translateEnum(Country, 'enums.country.', this.countries)
    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)

    console.warn(this.country)
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
