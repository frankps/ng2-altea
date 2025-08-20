import { Component, OnInit, ViewChild, Output, Input, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { plainToInstance } from 'class-transformer';
import { th } from 'date-fns/locale';
import { ContactService } from 'ng-altea-common';
import { Contact } from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'altea-search-contact',
  templateUrl: './search-contact.component.html',
  styleUrls: ['./search-contact.component.scss']
})
export class SearchContactComponent {

  @ViewChild('searchContactModal') public searchContactModal?: NgbModal;

  @Input() modal: boolean = false
  @Output() contactSelected: EventEmitter<Contact> = new EventEmitter();

  search: string = ''
  contacts: Contact[]

  constructor(private modalService: NgbModal, private contactSvc: ContactService) {

  }


  show() {
    this.modalService.open(this.searchContactModal)



  }


  async searchContact() {

    console.error(this.search)

    if (!this.search || this.search.length < 3) {
      this.contacts = []
      return
    }

    let query = new DbQuery()

    if (this.search.includes('@')) {
      query.and('email', QueryOperator.contains, this.search)
    } else {
      query.and('name', QueryOperator.contains, this.search)
    }


    let contacts = await this.contactSvc.query$(query)

    //let contacts = await this.contactSvc.search$(this.search)
    
    this.contacts = plainToInstance(Contact, contacts)

    console.log(this.contacts)
  }


  selectContact(contact: Contact, modalWin: any) {

    console.log(contact)

    this.contactSelected.emit(contact)


    console.warn(modalWin)

    if (this.modal && modalWin)
      modalWin.close()


  }



}
