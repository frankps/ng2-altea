import { Component } from '@angular/core';
import { BotService } from 'ng-altea-common';
import { DialogflowAnswer, DialogflowWebhookRequest, DialogflowWebhookResponse } from 'ts-altea-model';

const answers = ['Wij zijn volzet',
  'We hebben geen beschikbaarheid',
  'De beschikbare uren zijn: 9h, 11h15 of 15h. Welk moment verkiest u?',
  'De wellness kan nog geboekt worden om 9h, 16h en 20h. Welk startuur kiest u?'
]


@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})
export class DialogflowComponent {

  answers = answers

  response: DialogflowWebhookResponse
  textResponse = null

  constructor(public  botSvc: BotService) {

  }

  async dialogflowWebhook() {

    const request = DialogflowWebhookRequest.getDemo()

    console.warn(request)

    const response = await this.botSvc.dialogflowWebhook$(request)

    if (response)
      this.textResponse = response.getText()
    else
    this.textResponse = null

    console.warn(response)
    
  }

  async setAnswer(answer: string) {

    await this.botSvc.dialogflowSetTestAnswer$(new DialogflowAnswer(answer))
    console.error(answer)
  }


  // setTestAnswer


}
