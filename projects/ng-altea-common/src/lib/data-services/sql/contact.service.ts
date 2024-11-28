import { Injectable } from '@angular/core';
import { Contact } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { ApiResult, DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class ContactService extends BackendHttpServiceBase<Contact> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Contact, 'Contact', sessionSvc.backend, sessionSvc.branchUnique + '/contacts', http)
  }

  async getById$(id: string, ...includes: string[]): Promise<Contact> {

    let query = new DbQuery()
    query.and('id', QueryOperator.equals, id)
    query.include(...includes)

    return this.queryFirst$(query)
  }

  async searchByString$(searchFor: string): Promise<Contact[]> {

    let query = new DbQuery()


    query.and('name', QueryOperator.contains, searchFor)
    query.and('act', QueryOperator.equals, true)

    /*   if (contact.last)
        query.and('last', QueryOperator.contains, contact.last)
   */

    return this.query$(query)
  }

  /**
   * 
   * @param userId 
   * @param branchId 
   * @returns 
   */
  async getContactForUserInBranch(userId: string, branchId: string) {
    let query = new DbQuery()

    query.and('userId', QueryOperator.equals, userId)
    query.and('branchId', QueryOperator.equals, branchId)

    return this.queryFirst$(query)
  }

  async getContactsForUser(userId: string) : Promise<Contact[]> {
    let query = new DbQuery()

    query.and('userId', QueryOperator.equals, userId)
    query.and('act', QueryOperator.equals, true)

    return this.query$(query)
  }

  async searchContacts$(contact: Contact): Promise<Contact[]> {

    let query = new DbQuery()

    if (contact.first)
      query.and('first', QueryOperator.contains, contact.first)

    if (contact.last)
      query.and('last', QueryOperator.contains, contact.last)

    if (contact.mobile)
      query.and('mobile', QueryOperator.contains, contact.mobile)

    if (contact.email)
      query.and('email', QueryOperator.contains, contact.email)

    console.error(contact.mobile)

    return this.query$(query)


  }


  override async update$(object: Contact, resourceId?: string): Promise<ApiResult<Contact>> {

    object.setName()


    return super.update$(object, resourceId)



  }



}

