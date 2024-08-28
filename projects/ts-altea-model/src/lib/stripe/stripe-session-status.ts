
export class StripeSessionStatus {
    status: 'open' | 'complete' | 'expired'
    paymentStatus: 'paid' | 'unpaid' | 'no_payment_required'
    paymentIntentId: any
    orderId: string

    customer: {
        email: string
        name: string
        phone: string
    }
}