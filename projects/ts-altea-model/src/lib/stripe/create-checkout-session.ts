

export class CreateCheckoutSession {
    public isTest = true


    constructor(public amount: number, public description, public successUrl: string, public cancelUrl: string) {

    }
}

