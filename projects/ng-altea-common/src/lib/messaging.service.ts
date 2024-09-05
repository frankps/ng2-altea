import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, Subject, take } from "rxjs";
import { Message, SmsMessage, WebPushToUsers, WhatsAppCreateResult, WhatsAppMessage, WhatsAppTemplate, WhatsAppTemplateTrigger, WhatsAppTemplateUpdate, WhatsAppUpdateResult } from 'ts-altea-model';
import { ApiListResult, ApiResult } from 'ts-common';
import { SessionService } from './session.service';
import { plainToInstance } from 'class-transformer';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  constructor(protected http: HttpClient, protected sessionSvc: SessionService) { }


  async post$<T>(url: string, body: any): Promise<T> {
    const me = this

    return new Promise<T>(function (resolve, reject) {

      try {
        console.warn('post$', url, body)

        // .pipe(take(1))
        me.http.post<T>(url, body).pipe(take(1)).subscribe(res => {
          console.log(res)
          resolve(res)

        })

      } catch (error) {
        throw error
      }



    })

  }

  async sendMessage$(msg: Message): Promise<any> {

    let res = await this.post$<any>(`${this.sessionSvc.backend}/messaging/sendMessage`, msg)

    return res

  }


  // sendWhatsApp

  async sendWhatsApp$(msg: WhatsAppMessage): Promise<any> {

    let res = await this.post$<any>(`${this.sessionSvc.backend}/messaging/sendWhatsApp`, msg)

    return res

  }

  // sendWhatsAppTemplate

  async sendWhatsAppTemplate$(tpl: WhatsAppTemplateTrigger): Promise<any> {

    let res = await this.post$<any>(`${this.sessionSvc.backend}/messaging/sendWhatsAppTemplate`, tpl)

    return res

  }

  async createWhatsAppTemplate$(tpl: WhatsAppTemplate): Promise<ApiResult<WhatsAppCreateResult>> {

    let res = await this.post$<any>(`${this.sessionSvc.backend}/messaging/createWhatsAppTemplate`, tpl)

    return plainToInstance(ApiResult<WhatsAppCreateResult>, res)

  }

  async updateWhatsAppTemplate$(tpl: WhatsAppTemplateUpdate): Promise<ApiResult<WhatsAppUpdateResult>> {

    let res = await this.post$<any>(`${this.sessionSvc.backend}/messaging/updateWhatsAppTemplate`, tpl)

    return plainToInstance(ApiResult<WhatsAppUpdateResult>, res)

  }


  async sendSms$(msg: SmsMessage): Promise<any> {

    let res = await this.post$<any>(`${this.sessionSvc.backend}/messaging/sendSms`, msg)

    return res

  }

  async webPushToUsers$(msg: WebPushToUsers): Promise<ApiListResult<any>> {

    let res = await this.post$<ApiListResult<any>>(`${this.sessionSvc.backend}/messaging/webPushToUsers`, msg)

    return res

  }



  /*   @Post('webPushToUsers')
    public async webPushToUsers(msg: WebPushToUsers) {
  
        this.webPushSvc.webPushToUsers(msg)
  
    } */


}
