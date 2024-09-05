import { Component } from '@angular/core';
import { AlteaService, MessagingService, OrderMgrUiService, SessionService } from 'ng-altea-common';
import { OrderMgmtService } from 'ts-altea-logic';
import { MsgType, WhatsAppBodyComponent, WhatsAppMessage, WhatsAppTemplate, WhatsAppTemplateTrigger, WhatsAppTextParameter, WhatsAppTplParameters } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-debug-messaging',
  templateUrl: './debug-messaging.component.html',
  styleUrls: ['./debug-messaging.component.css']
})
export class DebugMessagingComponent {

  MsgType = MsgType

  constructor(protected orderMgrUiSvc: OrderMgrUiService, private alteaSvc: AlteaService, private sessionSvc: SessionService,
    private messagingSvc: MessagingService
  ) {

  }

  async sendTemplate(templateCode: string, ...types: MsgType[]) {

    const order = this.orderMgrUiSvc.order

    const orderMessaging = this.alteaSvc.orderMessaging

    const branch = await this.sessionSvc.branch$()

    const res = await orderMessaging.sendMessages(templateCode, order, branch, true, ...types)

    console.warn(res)

  }

  async sendEmail(templateCode: string) {
    await this.sendTemplate(templateCode, MsgType.email)
  }


  async testWhatsApp() {


    const msg = new WhatsAppMessage('+32478336034', 'Dit is een testje....')

    const order = this.orderMgrUiSvc.order
    msg.orderId = order?.id
    msg.contactId = order?.contact?.id

    const res = await this.messagingSvc.sendWhatsApp$(msg)

    console.warn('Whatsapp result:')
    console.warn(res)

  }

  async testWhatsAppTemplate() {

    const tpl = new WhatsAppTemplate('resv_test')

    tpl.components.push(new WhatsAppBodyComponent(`Dank voor de reservatie!

Tot spoedig!
      `))

    const res = await this.messagingSvc.createWhatsAppTemplate$(tpl)

    console.warn('Whatsapp result:')
    console.warn(res)


  }

  async testWhatsAppTemplate_old() {

    /*
32478336034
32475598284
    */

    const templateParams = new WhatsAppTplParameters()

    templateParams.body = [new WhatsAppTextParameter('Aquasense 3'),
    new WhatsAppTextParameter('€75'),
    new WhatsAppTextParameter('12h')
    ]

    templateParams.header = [new WhatsAppTextParameter('Aquasense 3')]

    const tpl = new WhatsAppTemplateTrigger('32478336034', 'resv_wait_deposito', 'NL', templateParams)

    const order = this.orderMgrUiSvc.order
    tpl.orderId = order?.id

    if (order.contact) {
      const contact = order.contact
      tpl.contactId = contact.id
      tpl.contact = { id: contact.id, name: contact.name }
    }

    const res = await this.messagingSvc.sendWhatsAppTemplate$(tpl)

    console.warn('Whatsapp result:')
    console.warn(res)

  }

}
