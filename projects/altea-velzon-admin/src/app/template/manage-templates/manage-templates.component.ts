import { Component, OnInit } from '@angular/core';
import { Template, TemplateAction, TemplateChannel, TemplateRecipient, TemplateType, orderTemplates } from 'ts-altea-model' //'../../../../../../libs/ts-altea-common/src';
import { DashboardService, NgSectionsComponent, ToastType } from 'ng-common';
import { ApiStatus, CollectionChangeTracker, DbQuery, QueryOperator } from 'ts-common'
import { SessionService, TemplateService } from 'ng-altea-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { ToastService } from '../../velzon/dashboard/dashboard/toast-service';

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
export class ManageTemplatesComponent extends NgSectionsComponent implements OnInit {

  selectionsAvailable = false

  //selectionProps = ['emailToProvider', 'msgToProvider', 'emailToClient', 'msgToClient']

  variants = [
    new TemplateVariant(TemplateChannel.email, TemplateRecipient.provider),
    new TemplateVariant(TemplateChannel.sms, TemplateRecipient.provider),
    new TemplateVariant(TemplateChannel.email, TemplateRecipient.client),
    new TemplateVariant(TemplateChannel.sms, TemplateRecipient.client)
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
    , protected dashboardSvc: DashboardService, public toastService: ToastService) {
    super()



    // 
  }

  ngOnInit() {

    this.initSelections()

    this.getTemplates()

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

      let channel = _.find(template.channels, channel => channel == TemplateChannel.email || channel == TemplateChannel.sms)
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
    // this.template = new Template()

    console.warn('Edit template', templateCode, variant)

    // _.constant
    // this.isEmail = (selectionProp && selectionProp.startsWith('email'))

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

    this.template = template

    console.warn(template)
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

  save() {





    if (!this.changes.hasChanges())
      return

    const batch = this.changes.getApiBatch()

    console.error(batch)

    this.templateSvc.batchProcess(batch, this.dashboardSvc.resourceId).subscribe(res => {

      if (res.status == ApiStatus.error) {
        this.dashboardSvc.showToastType(ToastType.saveError)
      } else {
        this.dashboardSvc.showToastType(ToastType.saveSuccess)
        this.changes.reset()
      }

    })

  }

}
