


export class WhatsAppBaseMessage {

  contactId: string
  orderId: string

  contact: { id: string, name: string }

}

export class WhatsAppMessage extends WhatsAppBaseMessage {

  constructor(public to: string, public body: string, public phoneId?: string, public replyToMessageId?: string) {
    super()
  }

}


/*
        "parameters": [
                      {
                        "type": "text",
                        "text": "text-string"
                      },
                      {
                        "type": "currency",
                        "currency": {
                          "fallback_value": "VALUE",
                          "code": "USD",
                          "amount_1000": 100
                        }
                      },
                      {
                        "type": "date_time",
                        "date_time": {
                          "fallback_value": "DATE"
                        }
                      }
                    ] 
*/


export abstract class WhatsAppTplParameter {
  constructor(public type: "text" | "currency" | "date_time") {

  }
}

export class WhatsAppTextParameter extends WhatsAppTplParameter {

  constructor(public text: string) {
    super("text")
  }
}

export class WhatsAppTplParameters {
  header: WhatsAppTplParameter[] = []
  body: WhatsAppTplParameter[] = []

  // for each button, max 1 parameter
  buttons: WhatsAppTextParameter[] = []
}

export class WhatsAppTemplateTrigger extends WhatsAppBaseMessage {

  constructor(public to: string, public name: string, public langLocale: string, public params: WhatsAppTplParameters, public phoneId?: string) {
    super()
  }

}