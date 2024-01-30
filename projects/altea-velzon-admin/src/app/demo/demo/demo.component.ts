import { Component, ViewChild } from '@angular/core';
import { Contact } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { ObjectService } from 'ng-altea-common';
import { CheckDeposists } from 'ts-altea-logic';
import { TranslationService } from 'ng-common'
import { Country } from 'ts-altea-model'
import { Translation } from 'ts-common';
import { HttpClient } from '@angular/common/http'; 

// Volgnummer;Uitvoeringsdatum;Valutadatum;Bedrag;Valuta rekening;Rekeningnummer;Type verrichting;Tegenpartij;Naam van de tegenpartij;
// Mededeling;Details;Status;Reden van weigering


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


  fileText: string;

  constructor(private http: HttpClient, public dbSvc: ObjectService, protected translationSvc: TranslationService, protected backEndSvc: ObjectService) {

    

  }




  read() {

    this.http.get('\Macintosh HD/Users/frankpaepens/code/altea/interface files/fortis download.csv', { responseType: 'text' }).subscribe(data => { 
      console.log(data); 
    }); 

  }

  readTextFile(file: File) { 
    const reader = new FileReader(); 
 
    reader.onload = () => { 
      this.fileText = reader.result as string; 

      console.log(this.fileText)
    }; 
 
    reader.readAsText(file); 
  } 


  async ngOnInit() {

 //   this.read()
/* 
    await this.translationSvc.translateEnum(Country, 'enums.country.', this.countries)
    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)

    console.warn(this.country) */
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
