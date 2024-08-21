import { Component, OnInit } from '@angular/core'
import { AuthService } from '../../auth/auth.service'
import { ContactService, SessionService } from 'ng-altea-common'
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common'
import { Contact, User } from 'ts-altea-model'
import { NgxSpinnerService } from 'ngx-spinner'
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-contact-match',
  templateUrl: './user-contact-match.component.html',
  styleUrls: ['./user-contact-match.component.scss']
})
export class UserContactMatchComponent implements OnInit {

  user: User
  contacts: Contact[] = []
  contactsFound = false

  redirect: string[]

  constructor(protected router: Router, protected authSvc: AuthService, protected contactSvc: ContactService, protected sessionSvc: SessionService, protected spinner: NgxSpinnerService) {

  }

  async ngOnInit() {
    this.user = this.authSvc.user
    await this.matchUserToContact()
  }

  async matchUserToContact() {

    this.spinner.show()

    const query = new DbQuery()

    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    const userName = this.user.getName()
    if (userName)
      query.or('name', QueryOperator.equals, userName)

    query.or('email', QueryOperator.equals, this.user.email)
    query.or('mobile', QueryOperator.equals, this.user.mobile)

    this.contacts = await this.contactSvc.query$(query)

    this.spinner.hide()

    if (ArrayHelper.NotEmpty(this.contacts))
      this.contactsFound = true
    else {
      this.contactsFound = false

      await this.createNewContactForUser()

    }


/*
    if (ArrayHelper.NotEmpty(this.contacts)) {

      if (this.contacts.length ==  1) {
        await this.linkContactToUser(this.contacts[0])

      } 
      // then we let the user select the best profile
    }
*/


    console.log(this.contacts)

  }

  async linkContactToUser(contact: Contact) {

    const user = this.authSvc.user

    this.spinner.show()

    contact.userId = user.id
    contact.markAsUpdated('userId')

    const res = await this.contactSvc.update$(contact)

    this.spinner.hide()
    
    console.warn(res)

    if (res.isOk) {
      this.sessionSvc.contact = res.object
      this.router.navigate(['/branch', 'aqua', 'menu'])
    }
  }


  async createNewContactForUser() {

    this.spinner.show()

    const branchId = this.sessionSvc.branchId

    const contact = this.user.toContact(branchId)

    const res = await this.contactSvc.create$(contact)

    console.warn(res)

    this.spinner.hide()

    if (res.isOk) {
      this.sessionSvc.contact = res.object
      this.router.navigate(['/branch', 'aqua', 'menu'])
    }
    

  }



}
