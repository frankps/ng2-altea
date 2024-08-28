

export class CreateCheckoutSession {
    public test = true

    // In case of Stripe-hosted payment page
    public successUrl: string
    public cancelUrl: string

    // In case of embedded form
    public returnUrl: string

    public methodTypes: any[] = ['card', 'bancontact']

    /** Customer email */ 
    public email: string

    /** Customer name */ 
    public name: string

    public orderId: string

    constructor(public amount: number, public currency: string, public description, public embedded = true) {
    }


    static embedded(amount: number, currency: string, description: string, returnUrl: string): CreateCheckoutSession {

        const session = new CreateCheckoutSession(amount, currency, description)

        session.returnUrl = returnUrl  

        return session
    }
}

