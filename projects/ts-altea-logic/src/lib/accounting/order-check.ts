import { Order } from "ts-altea-model"

export enum OrderCheckItemType {

    lineVatPctMismatch = 'lineVatPctMismatch',
    lineVatError = 'lineVatError',
    lineExclError = 'lineExclError',
    orderInclMismatch = 'orderInclMismatch',
    orderExclMismatch = 'orderExclMismatch',
    orderVatMismatch = 'orderVatMismatch',
    paidMismatch = 'paidMismatch',
    paidNotEqualTotal = 'paidNotEqualTotal',
    invoiceProblem = 'invoiceProblem',
    giftProblem = 'giftProblem'

}

export class OrderCheckItem {

    constructor(public type: OrderCheckItemType,
        public msg: string) {

    }

}

export class OrderCheck {

    items: OrderCheckItem[] = []

    constructor(public order: Order) {

    }

    add(type: OrderCheckItemType, msg: string) {

        let item = new OrderCheckItem(type, msg)
        this.items.push(item)

    }

}