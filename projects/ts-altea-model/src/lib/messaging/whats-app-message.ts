

export class WhatsAppMessage {

    constructor(public to: string, public body: string, public phoneId?: string, public replyToMessageId?: string) {

    }

}