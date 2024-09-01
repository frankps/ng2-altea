

export class WhatsAppMessage {

    constructor(public to: string, public body: string, public phoneId?: string, public replyToMessageId?: string) {
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


export class WhatsAppTemplate {

    constructor(public to: string, public name: string, public langLocale: string, public params: WhatsAppTplParameter[] = [], public phoneId?: string) {
    }

}