import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { HttpClient } from '@angular/common/http';
import { SessionService } from 'ng-altea-common';
import { DialogflowAnswer, DialogflowWebhookRequest, DialogflowWebhookResponse } from 'ts-altea-model';
import { plainToInstance } from 'class-transformer';

@Injectable({
  providedIn: 'root'
})
export class BotService extends HttpClientService {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(http, sessionSvc.backend)
  }

  // bot/dialogflow/webhook


  async dialogflowWebhook$(request: DialogflowWebhookRequest): Promise<DialogflowWebhookResponse> {

    let result = await this.post$(`bot/dialogflow/webhook`, request)

    const response = plainToInstance(DialogflowWebhookResponse, result)

    return response 

  }

  // setTestAnswer

  async dialogflowSetTestAnswer$(answer: DialogflowAnswer): Promise<any> {

    let result = await this.post$(`bot/dialogflow/setTestAnswer`, answer)

    return result // plainToInstance(ApiResult<any>, result)

  }

}
  