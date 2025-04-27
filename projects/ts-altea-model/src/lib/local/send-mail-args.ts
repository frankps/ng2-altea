import { ActionArgs } from "./action";

// { from: 'info@aquasense.be', to: 'frank@dvit.eu', subject: 'Wellness end', body: 'Einde van de wellness' }
export class SendMailArgs extends ActionArgs {
    constructor(public from: string, public to: string[], public subject: string, public body: string) {
        super()
    }
}


