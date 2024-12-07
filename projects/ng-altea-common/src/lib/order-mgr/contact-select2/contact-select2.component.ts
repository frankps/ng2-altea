import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core'
import { NgForm } from '@angular/forms'
import { AppMode, Branch, Contact, Country, MsgType } from 'ts-altea-model'
import { DashboardService, TranslationService } from 'ng-common'
import { ArrayHelper, ObjectHelper, Translation } from 'ts-common'
import { ContactService, SessionService } from 'ng-altea-common';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { NgxSpinnerService } from "ngx-spinner"


@Component({
  selector: 'order-mgr-contact-select2',
  templateUrl: './contact-select2.component.html',
  styleUrls: ['./contact-select2.component.css']
})
export class ContactSelect2Component implements OnInit {

  @Output() selected: EventEmitter<Contact> = new EventEmitter<Contact>();

  _contact: Contact = new Contact()

  /** a user (email/password) can be created at the same time */
  @Input() createUser = false

  @Input() inputsRequired = false

  @Input() set contact(value: Contact) {

    if (value) {
      this._contact = value
      this.isNew = (value.id == null)

    } else {

      this._contact = new Contact()
      this.isNew = true
    }
  }

  get contact() {
    return this._contact
  }


  isNew = true

  css_cls_row = 'mt-3'
  initialized = false
  @ViewChild('contactForm')
  contactForm: NgForm
  country: Translation[] = []
  msgTypes: Translation[] = []

  contacts: Contact[]
  branch: Branch

  translateParam //= { company: ''}

  showContacts = false

  orderDirtyOnChange = true

  /** if internally used (POS), then some more settings */
  appMode: AppMode

  AppMode = AppMode
  isPos = false

  showMore = false

  constructor(protected translationSvc: TranslationService, private contactSvc: ContactService
    , protected orderMgrSvc: OrderMgrUiService, private sessionSvc: SessionService, private dashboardSvc: DashboardService,
    protected spinner: NgxSpinnerService) {


  }

  newContact() {
    this.contact = new Contact()
    this.contact.markAsNew()
    this.isNew = true
    console.log(this.contact)
  }


  demoData() {
    /*
    sandra.enghien@gmail.com
    0493152231
    sandra enghien
    */
    this.contact.first = 'sandra'
    this.contact.last = 'enghien2'
    this.contact.mobile = '0493152231'
    this.contact.email = 'sandra.enghien@gmail.com'
  }

  async ngOnInit() {

    this.appMode = this.sessionSvc.appMode

    if (this.appMode == AppMode.pos)
      this.isPos = true

    console.log('APPPPPP MOOODE', this.appMode)

    await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    await this.translationSvc.translateEnum(MsgType, 'enums.msg-type.', this.msgTypes)

    this.msgTypes = this.msgTypes.filter(t => t.key != 'sms')

    this.branch = await this.sessionSvc.branch$()

    this.translateParam = { company: this.branch.name }
    console.log(this.translateParam)

    // this.demoData()

    this.initialized = true
  }



  formChanged(sectionId: string) {

    console.log(`Form changed: ${sectionId}`)

    switch (sectionId) {

      case "contact":
        this.contactForm.form.markAsDirty()
        break

    }
  }

  phoneChanged() {
    this.formChanged('contact')
    this.propertyChanged('mobile')

    if (this.orderDirtyOnChange)
      this.orderMgrSvc.orderDirty = true
  }

  propertyChanged(property: string, event?: any) {

    if (property)
      this._contact.m.setDirty(property)

    if (property == 'first' || property == 'last') {
      this._contact.setName()
    }

    if (this.orderDirtyOnChange)
      this.orderMgrSvc.orderDirty = true
  }


  confirm($event) {
    console.warn("Button 'request' clicked: 'confirm' method triggered!")
    console.warn(this.contact)
  }

  async searchContact() {

    let me = this

    me.contact.setName()  // to show correctly for new contact

    me.contacts = await me.contactSvc.searchContacts$(me.contact)

    console.log(me.contacts)

    if (ArrayHelper.NotEmpty(me.contacts))
      me.showContacts = true
    else
      await this.saveContact()

  }

  async saveContact(): Promise<Contact> {



    // if (this.contact.id)

    // if (this.contact.isNew())
    if (this.isNew)
      return await this.createAsNew()
    else
      return await this.updateContact()


  }

  async updateContact(): Promise<Contact> {
    let me = this

    let error
    try {
      this.spinner.show()

    } catch (err) {

      console.error(err)
      error = 'Problem updating contact!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('Contact saved!')

    }



    let res = await me.contactSvc.update$(me.contact, this.dashboardSvc.resourceId)

    this.selectContact(me.contact)


    return res.object
  }

  canSelectMsgType(msgType: any) {

    const contact = this.contact

    if (!contact || !msgType)
      return false

    switch (msgType) {
      case MsgType.email:
        // appMode != AppMode.pos && 

        if (this.appMode == AppMode.pos)
          return contact.email
        else
          return false    // we always send emails => user can not disable
      // return contact.email

      case MsgType.sms:
      case MsgType.wa:
        return contact.mobile

      default:
        return false
    }
  }




  contactsFound() {
    return Array.isArray(this.contacts) && this.contacts.length > 0
  }

  selectContact(contact: Contact) {

    this.contact = contact
    this.isNew = false
    this.showContacts = false
    console.log(contact)

    this.orderMgrSvc.setContact(contact)
    this.selected.emit(contact)
  }

  async createAsNew(): Promise<Contact> {

    let contact: Contact
    let error

    try {
      this.spinner.show()

      if (!this.contact.id)
        this.contact.id = ObjectHelper.newGuid()

      if (!this.contact.branchId)
        this.contact.branchId = this.branch.id

      this.contact.setName()

      const res = await this.contactSvc.create$(this.contact, this.dashboardSvc.resourceId)
      console.warn(res)

      if (res.isOk) {
        contact = res.object
        this.selectContact(contact)
      }

    } catch (err) {

      console.error(err)
      error = 'Problem creating contact!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('Contact created!')

    }

    return contact
  }

  editContact() {
    this.showContacts = false
    this.contacts = []
  }

}



