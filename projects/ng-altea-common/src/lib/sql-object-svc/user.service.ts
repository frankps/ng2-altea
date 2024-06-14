import { Injectable } from '@angular/core';
import {  Template, User } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../session.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BackendHttpServiceBase<User> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {

    super(User, 'User', sessionSvc.backend, 'users', http)
  }


  async getByUid(uid: string) : Promise<User | null> {

    const query = new DbQuery()
    query.and('uid', QueryOperator.equals, uid)
    query.take = 1

    let users = await this.query$(query)

    if (Array.isArray(users) && users.length > 0)
      return users[0]
    else
      return null

  }
}


/*
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }
}
*/
