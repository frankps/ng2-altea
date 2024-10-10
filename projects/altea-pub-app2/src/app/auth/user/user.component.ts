import { Component, ViewChild, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslationService } from 'ng-common';
import { Country, MsgType, User } from 'ts-altea-model';
import { ArrayHelper, Translation } from 'ts-common';
import { AuthService } from '../auth.service';
import { ContactService, UserService } from 'ng-altea-common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { retry } from 'rxjs';
import { IntPhoneEditComponent } from 'ng-common';
import { Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"

// Frank

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {

  @Input() linkUserToContact = true

  redirect: string[]

  user: User

  css_cls_row = 'mt-3'
  initialized = false

  @ViewChild('userForm')
  userForm: NgForm

  @ViewChild('intPhone')
  intPhone: IntPhoneEditComponent

  country: Translation[] = []
  msgTypes: Translation[] = []

  translationPaths = {
    button: 'dic.continue'
  }

  // translationPaths.button

  constructor(protected router: Router, protected authSvc: AuthService, protected translationSvc: TranslationService,
    protected userSvc: UserService, protected contactSvc: ContactService,
    protected spinner: NgxSpinnerService
  ) {

  }

  async loadTestUser() {
    this.user = await this.userSvc.get$("d77c3525-0ad6-4605-bf60-3004fcc9030d")
  }


  async ngOnInit() {

    //this.user = this.authSvc.user

    // await this.loadTestUser()



    this.user = this.authSvc.user

    console.warn(this.user)

    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    await this.translationSvc.translateEnum(MsgType, 'enums.msg-type.', this.msgTypes)

    this.initialized = true
    this.translationPaths.button = 'msg.save'

    if (this.linkUserToContact) {

    }

    // console.warn(this.linkUserToContact)
  }

  mobileChanged() {
    // this.formChanged('user')
    this.userForm.form.markAsDirty()
  }

  /*
  formChanged(sectionId: string) {

    console.log(`Form changed: ${sectionId}`)

    switch (sectionId) {

      case "contact":
        this.userForm.form.markAsDirty()
        break

    }
  } */


  selectMsgType(msgType: any, selected: boolean) {
    this.user.selectMsgType(msgType, selected)
    // this.userForm.controls[msgType].markAsDirty()
    this.userForm.form.markAsDirty()
  }

  canSelectMsgType(msgType: any) {

    const user = this.user

    if (!user || !msgType)
      return false

    switch (msgType) {
      case MsgType.email:
        return user.email

      case MsgType.sms:
      case MsgType.wa:
        return user.mobile

      default:
        return false
    }
  }


  /**
   * if user is linked to existing contacts (different businesses), then update these contacts with latest info
   * @param user 
   * @returns 
   */
  async updateLinkedContacts(user: User) {

    if (!user)
      return

    let error

    try {
      this.spinner.show()

      const contacts = await this.contactSvc.getContactsForUser(user.id)

      console.warn(`Linked contacts for user: ${user.id}`, contacts)

      if (ArrayHelper.IsEmpty(contacts))
        return


      for (let contact of contacts) {

        if (contact.email != user.email && user.email) {
          contact.email = user.email
          contact.markAsUpdated('email')
        }

        if (contact.mobile != user.mobile && user.mobile) {
          contact.mobile = user.mobile
          contact.markAsUpdated('mobile')
        }

        if (!contact.hasSameMsg(user.msg) && ArrayHelper.NotEmpty(user.msg)) {
          contact.msg = user.msg
          contact.markAsUpdated('msg')
        }


        if (contact.isDirty()) {

          console.warn(`Updated contact`, contact)

          var contactUpdateRes = await this.contactSvc.update$(contact)

          console.log(contactUpdateRes)

        }

      }


    } catch (err) {

      console.error(err)
      error = 'Problem updating contacts!'

    } finally {

      this.spinner.hide()

    }









  }


  async continue() {

    let me = this

    if (this.userForm.form.dirty) {

      this.spinner.show()


      console.warn(this.user)
      const res = await this.userSvc.update$(this.user)
      console.warn(res)



      console.log(res)

      if (res.isOk) {
        await this.authSvc.refreshUser(this.user)

        this.spinner.hide()
      }


      const updateContacts = await me.updateLinkedContacts(this.user)

    }


    if (me.linkUserToContact)
      me.router.navigate(['/branch', 'aqua', 'user-contact'])
  }


  mobileValid(): boolean {

    if (!this.user || !this.user.mobile)
      return false

    const valid = this.intPhone ? this.intPhone.isValid() : false

    return valid

    //this.userForm.dirty

    /*
    const parsedNumber = parsePhoneNumberFromString(this.user.mobile, 'BE');

    return parsedNumber.isValid()
    */
  }


}
