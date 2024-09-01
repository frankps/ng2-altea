import { Component } from '@angular/core';
import { AlteaService, MessagingService, OrderMgrUiService, SessionService } from 'ng-altea-common';
import { OrderMgmtService } from 'ts-altea-logic';
import { MsgType, WhatsAppMessage, WhatsAppTemplate, WhatsAppTextParameter } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-debug-messaging',
  templateUrl: './debug-messaging.component.html',
  styleUrls: ['./debug-messaging.component.css']
})
export class DebugMessagingComponent {

  constructor(protected orderMgrUiSvc: OrderMgrUiService, private alteaSvc: AlteaService, private sessionSvc: SessionService,
    private messagingSvc: MessagingService
  ) {

  }

  async sendTemplate(templateCode: string) {

    const order = this.orderMgrUiSvc.order

    const orderMessaging = this.alteaSvc.orderMessaging

    const branch = await this.sessionSvc.branch$()

    const res = await orderMessaging.sendMessages(templateCode, order, branch, true, MsgType.wa)

    console.warn(res)

  }


  async testWhatsApp() {

    const msg = new WhatsAppMessage('+32478336034', 'Dit is een testje....')

    const res = await this.messagingSvc.sendWhatsApp$(msg)

    console.warn('Whatsapp result:')
    console.warn(res)

  }

  async testWhatsAppTemplate() {

    /*
32478336034
    */

    const tpl = new WhatsAppTemplate('+32475598284', 'resv_wait_deposit', 'NL', [new WhatsAppTextParameter('Aquasense 2'),
    new WhatsAppTextParameter('€75'),
    new WhatsAppTextParameter('12h')
    ])

    const res = await this.messagingSvc.sendWhatsAppTemplate$(tpl)

    console.warn('Whatsapp result:')
    console.warn(res)


    /* 
                    "parameters": [
                      {
                        "type": "text",
                        "text": "Aquasense"
                      },
                      {
                        "type": "text",
                        "text": "€50"
                      },
                      {
                        "type": "text",
                        "text": "24h"
                      }
                    ]
                      */

  }

}
