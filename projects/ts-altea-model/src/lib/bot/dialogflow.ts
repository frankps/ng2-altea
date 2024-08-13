
// https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#webhook_request

import { plainToInstance } from "class-transformer"
import { ArrayHelper, ObjectHelper } from "ts-common"
import { Exclude, Type, Transform } from "class-transformer";

const dialogflowWebhookDemoRequest = `{
    "responseId": "response-id",
    "session": "projects/project-id/agent/sessions/session-id",
    "queryResult": {
      "queryText": "End-user expression",
      "parameters": {
        "param-name": "param-value"
      },
      "allRequiredParamsPresent": true,
      "fulfillmentText": "Response configured for matched intent",
      "fulfillmentMessages": [
        {
          "text": {
            "text": [
              "Response configured for matched intent"
            ]
          }
        }
      ],
      "outputContexts": [
        {
          "name": "projects/project-id/agent/sessions/session-id/contexts/context-name",
          "lifespanCount": 5,
          "parameters": {
            "param-name": "param-value"
          }
        }
      ],
      "intent": {
        "name": "projects/project-id/agent/intents/intent-id",
        "displayName": "matched-intent-name"
      },
      "intentDetectionConfidence": 1,
      "diagnosticInfo": {},
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {}
  }`

export class DialogflowWebhookRequest {
  responseId: string
  session: string
  queryResult: {
    queryText: string
    parameters: any
    allRequiredParamsPresent: string,
    fulfillmentText,
    fulfillmentMessages: any[]
    outputContexts: any[]
    intent: {
      name: string
      displayName: string
    }
    intentDetectionConfidence: number
    diagnosticInfo: {}
    languageCode: string
  }
  originalDetectIntentRequest: any


  static getDemo(projectId?: string, sessionId?: string, intentId?: string, responseId?: string): DialogflowWebhookRequest {

    if (!projectId) projectId = ObjectHelper.newGuid()
    if (!sessionId) sessionId = ObjectHelper.newGuid()
    if (!responseId) responseId = ObjectHelper.newGuid()
    if (!intentId) intentId = ObjectHelper.newGuid()

    var requestJson = dialogflowWebhookDemoRequest

    requestJson = requestJson.replace(/project-id/g, projectId)
    requestJson = requestJson.replace(/session-id/g, sessionId)
    requestJson = requestJson.replace(/response-id/g, responseId)
    requestJson = requestJson.replace(/intent-id/g, intentId)

    var request = JSON.parse(requestJson)
    var typed = plainToInstance(DialogflowWebhookRequest, request)

    return typed

  }
}


/** The message stored in firebase */
export class DialogflowWebhookRequestDb {
  responseId: string
  projectId: string
  sessionId: string

  /** the original request */
  request: DialogflowWebhookRequest

  constructor(request: DialogflowWebhookRequest) {

    if (!request)
      return

    this.responseId = request.responseId
    this.request = request

    if (request.session) {
      let items = request.session.split('/')

      this.projectId = items[1]
      this.sessionId = items[4]
    }
  }
}

export class DialogflowWebhookResponseMessage {
  text: { text: string[] }

  getText() {
    if (!this.text || ArrayHelper.IsEmpty(this.text.text))
      return null

    return this.text.text.join(', ')
  }

}

export class DialogflowWebhookResponse {

  @Type(() => DialogflowWebhookResponseMessage)
  fulfillmentMessages: DialogflowWebhookResponseMessage[]

  getText() {
    if (ArrayHelper.IsEmpty(this.fulfillmentMessages))
      return ''

    const allText = this.fulfillmentMessages.map(msg => msg.getText()).filter(txt => txt != null)

    return allText.join(', ')
  }

}



export class DialogflowAnswer {

  constructor(public text: string) { }
}

/*
https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#webhook_response

{
    "responseId": "response-id",
    "session": "projects/project-id/agent/sessions/session-id",
    "queryResult": {
      "queryText": "End-user expression",
      "parameters": {
        "param-name": "param-value"
      },
      "allRequiredParamsPresent": true,
      "fulfillmentText": "Response configured for matched intent",
      "fulfillmentMessages": [
        {
          "text": {
            "text": [
              "Response configured for matched intent"
            ]
          }
        }
      ],
      "outputContexts": [
        {
          "name": "projects/project-id/agent/sessions/session-id/contexts/context-name",
          "lifespanCount": 5,
          "parameters": {
            "param-name": "param-value"
          }
        }
      ],
      "intent": {
        "name": "projects/project-id/agent/intents/intent-id",
        "displayName": "matched-intent-name"
      },
      "intentDetectionConfidence": 1,
      "diagnosticInfo": {},
      "languageCode": "en"
    },
    "originalDetectIntentRequest": {}
  }

  */