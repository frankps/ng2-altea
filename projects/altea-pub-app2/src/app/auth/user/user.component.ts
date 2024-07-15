import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslationService } from 'ng-common';
import { Country, MsgType, User } from 'ts-altea-model';
import { Translation } from 'ts-common';
import { AuthService } from '../auth.service';
import { UserService } from 'ng-altea-common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { retry } from 'rxjs';
import { IntPhoneEditComponent } from 'ng-common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {

  user: User

  css_cls_row = 'mt-3'
  initialized = false

  @ViewChild('userForm')
  userForm: NgForm

  @ViewChild('intPhone')
  intPhone: IntPhoneEditComponent

  country: Translation[] = []
  msgTypes: Translation[] = []

  constructor(protected router: Router, protected authSvc: AuthService, protected translationSvc: TranslationService, protected userSvc: UserService) {

  }

  async loadTestUser() {
    this.user = await this.userSvc.get$("d77c3525-0ad6-4605-bf60-3004fcc9030d")
  }


  async ngOnInit() {

    //this.user = this.authSvc.user

    await this.loadTestUser()

    console.warn(this.user)

    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    await this.translationSvc.translateEnum(MsgType, 'enums.msg-type.', this.msgTypes)

    this.initialized = true
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

  async continue() {

    if (this.userForm.form.dirty) {
      console.warn(this.user)
      const res = await this.userSvc.update$(this.user)
      console.warn(res)
  
      console.log(res)
  
      if (res.isOk) {
        await this.authSvc.refreshUser(this.user)
        
      }
    }

    this.router.navigate(['/branch', 'aqua', 'user-contact'])
  }


  mobileValid() : boolean {

    if (!this.user || !this.user.mobile)
      return false

    const valid = this.intPhone?this.intPhone.isValid():false

    return valid

    //this.userForm.dirty

    /*
    const parsedNumber = parsePhoneNumberFromString(this.user.mobile, 'BE');

    return parsedNumber.isValid()
    */
  }


}
