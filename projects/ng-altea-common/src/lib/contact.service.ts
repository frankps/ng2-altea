import { Injectable } from '@angular/core';
import { Contact } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { ApiResult, DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class ContactService extends BackendHttpServiceBase<Contact> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Contact, 'Contact', sessionSvc.backend, sessionSvc.branchUnique + '/contacts', http)
  }

  async searchByString$(searchFor: string): Promise<Contact[]> {

    let query = new DbQuery()

    
      query.and('name', QueryOperator.contains, searchFor)

  /*   if (contact.last)
      query.and('last', QueryOperator.contains, contact.last)
 */

    return this.query$(query)


  }

  async searchContacts$(contact: Contact): Promise<Contact[]> {

    let query = new DbQuery()

    if (contact.first)
      query.and('first', QueryOperator.contains, contact.first)

    if (contact.last)
      query.and('last', QueryOperator.contains, contact.last)


    return this.query$(query)


  }


  override async update$(object: Contact): Promise<ApiResult<Contact>> {

    object.setName()


    return super.update$(object)
  
  
  
  }



}

