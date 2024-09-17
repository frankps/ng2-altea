import { Component, OnDestroy, OnInit } from '@angular/core';
import { Template, TemplateAction, TemplateChannel, TemplateFormat, TemplateRecipient, TemplateType, WhatsAppTemplate, WhatsAppTemplateUpdate, orderTemplates } from 'ts-altea-model' //'../../../../../../libs/ts-altea-common/src';
import { DashboardService, NgSectionsComponent, ToastType } from 'ng-common';
import { ApiStatus, CollectionChangeTracker, DbQuery, QueryOperator } from 'ts-common'
import { MessagingService, SessionService, TemplateService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { ToastService } from '../../velzon/dashboard/dashboard/toast-service';
import { Editor } from 'ngx-editor'
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'


export class TemplateTypeSelections {
  email_provider = false
  sms_provider = false
  email_client = false
  sms_client = false
}

export class TemplateVariant {
  constructor(public channel: TemplateChannel, public recipient: TemplateRecipient) { }
}

@Component({
  selector: 'app-manage-templates',
  templateUrl: './manage-templates.component.html',
  styleUrls: ['./manage-templates.component.scss'],
})
export class ManageTemplatesComponent extends NgSectionsComponent implements OnInit, OnDestroy {

  // html editor 
  editor: Editor;
  html = '';


  initialized = false

  format: Translation[] = []

  selectionsAvailable = false

  TemplateFormat = TemplateFormat

  canExport = false

  //selectionProps = ['emailToProvider', 'msgToProvider', 'emailToClient', 'msgToClient']

  channels = [TemplateChannel.email, TemplateChannel.wa]

  variants = [
    new TemplateVariant(TemplateChannel.email, TemplateRecipient.provider),
    new TemplateVariant(TemplateChannel.wa, TemplateRecipient.provider),
    new TemplateVariant(TemplateChannel.email, TemplateRecipient.client),
    new TemplateVariant(TemplateChannel.wa, TemplateRecipient.client)
  ]

  selections: { [index: string]: TemplateTypeSelections } = {};

  //templateTypes = [TemplateType.confirmation, TemplateType.cancel, TemplateType.change, TemplateType.reminder]


  templateCodes = orderTemplates

  /** Template can be for an email or for SMS  */
  //isEmail = false

  templates: Template[]
  template?: Template // = new Template()

  changes: CollectionChangeTracker<Template>


  constructor(protected spinner: NgxSpinnerService, protected sessionSvc: SessionService, protected templateSvc: TemplateService
    , protected dashboardSvc: DashboardService, public translationSvc: TranslationService, public toastService: ToastService,
    private messagingSvc: MessagingService) {
    super()



    // 
  }

  async ngOnInit() {
    this.editor = new Editor()

    await this.translationSvc.translateEnum(TemplateFormat, 'enums.template-format.', this.format)
    console.warn(this.format)

    this.initSelections()

    this.getTemplates()

    this.initialized = true


  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  override cancel() {
    super.cancel()

    this.changes.cancel()

    this.initSelections()

    console.warn(this.templates)
    this.makeSelections(this.templates)
  }

  initSelections() {

    for (let templateCode of this.templateCodes) {
      this.selections[templateCode] = new TemplateTypeSelections()
    }

    // console.error(this.selections)
    // console.error(this.selections[TemplateType.confirmation])
  }


  makeSelections(templates: Template[]) {

    // _.includes(t.channels, variant.channel) && _.includes(t.to, variant.recipient)

    for (let template of templates.filter(t => t.act)) {

      if (!_.includes(this.templateCodes, template.code))
        continue

      // channels
      let channel = _.find(template.channels, channel => channel == TemplateChannel.email || channel == TemplateChannel.wa)
      let recipient = _.find(template.to, recipient => recipient == TemplateRecipient.provider || recipient == TemplateRecipient.client)

      if (!channel || !recipient)
        continue

      var prop = channel + '_' + recipient

      this.selections[template.code][prop] = true

    }

  }



  getTemplates() {

    this.spinner.show()

    const query = new DbQuery()
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.and('code', QueryOperator.in, orderTemplates)
    query.and('act', QueryOperator.equals, true)

    query.orderBy('idx')

    this.templateSvc.query(query).subscribe(templates => {

      if (templates?.data) {
        this.templates = templates?.data
        this.makeSelections(this.templates)
      }

      console.warn(this.templates)

      this.changes = new CollectionChangeTracker<Template>(this.templates, Template)

      this.selectionsAvailable = true
      this.spinner.hide()
    })

  }



  startEditSection(sectionId: string, sectionParam: string): void {

  }

  test() {
    console.warn(this.selections)
  }

  addTemplateAction(template: Template) {
    if (!template.actions) {
      template.actions = []
    }

    if (template.actions.length == 0)
      template.actions.push(new TemplateAction())
  }

  editTemplate(templateCode: string, variant: TemplateVariant) {


    console.warn('Edit template', templateCode, variant)


    /*
    Template should already exist!
    Was created by: selectionChanged(...)
    */

    var template = this.templates.find(t => t.code == templateCode && t.channels && t.to
      && _.includes(t.channels, variant.channel) && _.includes(t.to, variant.recipient))


    this.changes.update(template)

    if (!template.actions) {
      template.actions = []
    }

    /*
    if (template.actions.length == 0)
      template.actions.push(new TemplateAction())
*/


  //  this.canExport = true
   this.canExport = template.hashChanged()

    this.template = template

    console.warn(template)
  }


  /**
   *  Templates:
   *     https://business.facebook.com/wa/manage/message-templates/?business_id=1868859750078498&waba_id=317260764808883 
   */

  async exportToWhatsApp(template: Template) {

    console.warn(template)

    // if template was not yet exported (no extId)
    if (!template.extId)
      await this.createNewWhatsAppTemplate(template)
    else
      await this.updateWhatsAppTemplate(template)

  }

  async updateWhatsAppTemplate(template: Template) {

    let error

    try {
      this.spinner.show()


      template.updateParameters()
      console.warn(template)

      const whatsAppTpl = WhatsAppTemplateUpdate.fromTemplate(template)  //WhatsAppTemplate.fromTemplate(template)

      console.warn(whatsAppTpl)
/*
      this.spinner.hide()
      return
*/

      const whatsAppResult = await this.messagingSvc.updateWhatsAppTemplate$(whatsAppTpl)

      console.warn(whatsAppResult)


      if (!whatsAppResult.isOk) {

        console.log('Hash: ', this.template.hash)

        this.template.updateHash()

        const tplUpdateResult = await this.templateSvc.update$(this.template, this.sessionSvc.humanResource?.id)

        console.log('Hash: ', this.template.hash)
        this.canExport = false

        console.warn(this.template, tplUpdateResult)

        if (whatsAppResult.error?.error_user_msg)
          error = whatsAppResult.error?.error_user_msg
        else
          error = 'Problem updating WhatsApp template!'
      }





    } catch (err) {

      console.error(err)
      error = 'Problem updating WhatsApp template!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('Template exported')

    }



  }


  async createNewWhatsAppTemplate(template: Template) {

    const whatsAppTpl = WhatsAppTemplate.fromTemplate(template)

    if (!whatsAppTpl)
      return

    try {
      this.spinner.show()

      const whatsAppResult = await this.messagingSvc.createWhatsAppTemplate$(whatsAppTpl)

      console.warn(whatsAppResult)

      if (whatsAppResult.isOk && whatsAppResult.object.id) {

        this.template.extId = whatsAppResult.object.id
        this.template.markAsUpdated('extId')

        console.log('Hash: ', this.template.hash)

        this.template.updateHash()

        const tplUpdateResult = await this.templateSvc.update$(this.template, this.sessionSvc.humanResource?.id)

        console.log('Hash: ', this.template.hash)

        console.warn(tplUpdateResult)

        if (tplUpdateResult.isOk)
          this.dashboardSvc.showSuccessToast('Template exported')
        else
          this.dashboardSvc.showErrorToast('Could not update template')

      } else {
        this.dashboardSvc.showErrorToast('Could not create template')
      }


      console.error(whatsAppResult)

    } catch (err) {

      console.error(err)

    } finally {
      this.spinner.hide()
    }


  }


  selectionChanged(selected: boolean, templateCode: string, variant: TemplateVariant) {
    //    console.warn($event)

    var template = this.templates.find(t => t.code == templateCode && t.channels && t.to
      && _.includes(t.channels, variant.channel) && _.includes(t.to, variant.recipient))

    if (!selected) {

      if (template) {
        template.act = false
        this.changes.update(template)
      }

    }

    if (selected) {

      if (template) {

        if (!template.act) {
          template.act = true
          this.changes.update(template)
        }

      }

      if (!template) {
        template = new Template()
        template.cat = 'order'
        template.code = templateCode
        template.orgId = this.sessionSvc.orgId
        template.branchId = this.sessionSvc.branchId
        template.to.push(variant.recipient)
        template.channels.push(variant.channel)

        this.changes.add(template)
      }
    }
  }

  async save() {





    if (!this.changes.hasChanges())
      return

    const batch = this.changes.getApiBatch()

    console.error(batch)

    const res = await this.templateSvc.batchProcess$(batch, this.dashboardSvc.resourceId)

    console.warn(res)


    if (res.status == ApiStatus.error) {
      this.dashboardSvc.showToastType(ToastType.saveError)
    } else {
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
      this.changes.reset()
    }

  }

}
