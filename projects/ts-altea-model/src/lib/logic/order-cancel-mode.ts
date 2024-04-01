
export enum ObjectState {
    active,
    inactive,
    softDelete,
    hardDelete
}

export enum PaymentChange {
    keep,
    convertToGift

}

export class OrderCancelMode {

    order: ObjectState = ObjectState.inactive
    payments = PaymentChange.keep
    planning: ObjectState = ObjectState.inactive


}