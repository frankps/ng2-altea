import { Component, OnInit } from '@angular/core'
import { AuthService } from '../../auth/auth.service'
import { ContactService, SessionService, UserService } from 'ng-altea-common'
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common'
import { Contact, User } from 'ts-altea-model'
import { NgxSpinnerService } from 'ngx-spinner'
import { Router } from '@angular/router';


/**
 * when merging contacts, we need to compare the different properties (email, mobile, first, last)
 */
export class StringDiff {

  uniq: string[] = []

  constructor(...toCompare: string[]) {

    if (ArrayHelper.IsEmpty(toCompare))
      return

    for (let item of toCompare) {

      if (!item || item.trim().length == 0)
        continue

      item = item.trim()

      if (this.uniq.indexOf(item) >= 0)
        continue

      this.uniq.push(item)

    }




  }

  isUniq(): boolean {
    return (this.uniq && this.uniq.length == 1)
  }

  notUniq(): boolean {
    return (this.uniq && this.uniq.length > 1)
  }

  /** there is max 1 unique value */
  maxOne(): boolean {
    return (!this.uniq || this.uniq.length < 2)
  }

}

export class ContactDiffs {
  first: StringDiff = new StringDiff()
  last: StringDiff = new StringDiff()

  email: StringDiff = new StringDiff()
  mobile: StringDiff = new StringDiff()

  hasDifferences(): boolean {

    let uniq = (this.first?.maxOne() && this.last?.maxOne() && this.email?.maxOne() && this.mobile?.maxOne())

    return !uniq
  }
}

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

  /** selected contact */
  selected: Contact

  /** when we match a (branch) contact with a user (logged in), then there might be differences.
   * If so, we present to app-user in order to resolve
    */
  contactDiffs: ContactDiffs
  hasDifferences: boolean = false




  constructor(protected router: Router, protected authSvc: AuthService, protected contactSvc: ContactService, protected userSvc: UserService,
    protected sessionSvc: SessionService, protected spinner: NgxSpinnerService) {

  }

  async ngOnInit() {
    this.user = this.authSvc.user
    await this.matchUserToContact()
  }

  back() {
    this.selected = null
  }

  async matchUserToContact() {

    let me = this

    if (!me.user)
      return

    me.spinner.show()

    const query = new DbQuery()

    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    const userName = me.user.getName()
    if (userName)
      query.or('name', QueryOperator.equals, userName)

    if (this.user.email && this.user.email.length > 4)
      query.or('email', QueryOperator.equals, this.user.email)

    if (this.user.mobile && this.user.mobile.length > 7)
      query.or('mobile', QueryOperator.equals, this.user.mobile)

    me.contacts = await me.contactSvc.query$(query)

    me.spinner.hide()

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





  resolveDifferences(user: User, contact: Contact): ContactDiffs {

    let contactDiffs = new ContactDiffs()

    contactDiffs.first = new StringDiff(user.first, contact.first)
    contactDiffs.last = new StringDiff(user.last, contact.last)
    contactDiffs.email = new StringDiff(user.email, contact.email)
    contactDiffs.mobile = new StringDiff(user.mobile, contact.mobile)


    return contactDiffs


  }

  async startLinkContactToUser(contact: Contact) {




    const user = this.authSvc.user

    this.contactDiffs = this.resolveDifferences(user, contact)
    this.hasDifferences = this.contactDiffs.hasDifferences()


    if (!this.hasDifferences) {

      /** there are no differences: we can link immediatly */
      await this.linkContactToUser(contact, user)

    } else {
      /** set this contact as current selected */
      this.selected = contact
    }


  }


  propertyChanged(contact: Contact, propertyName: string) {

    console.warn(`propertyChanged: ${propertyName}`)
    contact.markAsUpdated(propertyName)


  }

  async linkContactToUser(contact: Contact, user: User, updateUser: boolean = false) {


    if (updateUser) {

      if (user.email != contact.email) {
        user.email = contact.email
        user.markAsUpdated('email')
      }


      if (user.mobile != contact.mobile) {
        user.mobile = contact.mobile
        user.markAsUpdated('mobile')
      }


    }

    this.spinner.show()

    contact.userId = user.id
    contact.markAsUpdated('userId')

    const resContact = await this.contactSvc.update$(contact)

    if (updateUser) {
      const resUser = await this.userSvc.update$(user)
      console.warn(resUser)
    }

    this.spinner.hide()

    console.warn(resContact)

    if (resContact.isOk) {
      this.sessionSvc.contact = resContact.object
      await this.continue()
    }


  }

  async continue() {

    if (this.authSvc.redirect) {
      /** was implemented for flow when user not logged in and making order
       *  -> at a certain moment 
       */
      this.router.navigate(this.authSvc.redirect)
    }
    else
      this.router.navigate(['/branch', 'aqua', 'menu'])

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
      await this.continue()
    }


  }



}
