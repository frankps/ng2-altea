import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ContactService } from 'ng-altea-common';
import { DbQuery, QueryOperator } from 'ts-common';
import { Contact } from 'ts-altea-model';

@Component({
  selector: 'app-user-contact-match',
  templateUrl: './user-contact-match.component.html',
  styleUrls: ['./user-contact-match.component.scss']
})
export class UserContactMatchComponent implements OnInit {

  contacts: Contact[] = []

  constructor(protected authSvc: AuthService, protected contactSvc: ContactService) {

  }

  async ngOnInit() {
    await this.matchUserToContact()
  }

  async matchUserToContact() {

    const user = this.authSvc.user

    const query = new DbQuery()
    query.or('email', QueryOperator.equals, user.email)
    query.or('mobile', QueryOperator.equals, user.mobile)

    this.contacts = await this.contactSvc.query$(query)

    console.log(this.contacts)

  }

  async linkContactToUser(contact: Contact) {

    const user = this.authSvc.user

    contact.userId = user.id
    contact.markAsUpdated('userId')

    const res = await this.contactSvc.update$(contact)

    console.warn(res)
  }

}
