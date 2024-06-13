/** Minimal object classes (subset of equivalent full classes, ex: OrderUi subset of Order):
 *  for read-only purposes, such as calendar
 * 
 *  Idea is to have read-only versions of each order in the Firebase database
 *  Each time an order is changed in the (Cockroach) SQL, we update the Firebase read-only version,
 *  from there it is pushed to the UIs
 * 
 */

import { Type } from "class-transformer"
import { Contact, Order, OrderLine, OrderLineOption, OrderLineOptionValue } from "./altea-schema"
import { ArrayHelper } from "ts-common"

export class ObjectUi {
    id: string
}

export class ContactUi extends ObjectUi {
    
    name: string
    mobile?: string;
    email?: string;

    static fromContact(contact: Contact): ContactUi {

        if (!contact)
            return null

        const contactUi = new ContactUi()
        contactUi.name = contact.name
        contactUi.mobile = contact.mobile
        contactUi.email = contact.email

        return contactUi
    }
}

export class OrderLineOptionValueUi extends ObjectUi {
    name?: string

    static fromOrderLineOptionValue(value: OrderLineOptionValue): OrderLineOptionValueUi {

        if (!value)
            return null

        const valueUi = new OrderLineOptionValueUi()
        valueUi.id = value.id
        valueUi.name = value.name

        return valueUi
    }

}

export class OrderLineOptionUi extends ObjectUi {
    name?: string

    @Type(() => OrderLineOptionValueUi)
    values: OrderLineOptionValueUi[] = []


    static fromOrderLineOption(option: OrderLineOption): OrderLineOptionUi {

        if (!option)
            return null

        const optionUi = new OrderLineOptionUi()
        optionUi.id = option.id
        optionUi.name = option.name

        if (ArrayHelper.NotEmpty(option.values))
            optionUi.values = option.values.map(value => OrderLineOptionValueUi.fromOrderLineOptionValue(value))

        return optionUi
    }
}

export class OrderLineUi extends ObjectUi {
    qty: number
    descr?: string;

    @Type(() => OrderLineOptionUi)
    options: OrderLineOptionUi[] = []

    static fromOrderLine(line: OrderLine): OrderLineUi {

        if (!line)
            return null

        const lineUi = new OrderLineUi()
        lineUi.id = line.id
        lineUi.qty = line.qty
        lineUi.descr = line.descr


        if (ArrayHelper.NotEmpty(line.options))
            lineUi.options = line.options.map(option => OrderLineOptionUi.fromOrderLineOption(option))


        return lineUi

    }
}

export class OrderUi extends ObjectUi {

    @Type(() => ContactUi)
    contact: ContactUi

    @Type(() => OrderLineUi)
    lines: OrderLineUi[] = []

    start?: number; // format: yyyyMMddHHmmss
    end?: number; // format: yyyyMMddHHmmss

    paid = 0
    deposit = 0
    incl = 0

    static fromOrder(order: Order): OrderUi {

        if (!order)
            return null

        const orderUi = new OrderUi()
        orderUi.id = order.id
        orderUi.start = order.start
        orderUi.end = order.end
        orderUi.paid = order.paid
        orderUi.deposit = order.deposit
        orderUi.incl = order.incl

        if (order.contact)
            orderUi.contact = ContactUi.fromContact(order.contact)

        if (ArrayHelper.NotEmpty(order.lines))
            orderUi.lines = order.lines.map(line => OrderLineUi.fromOrderLine(line))


        return orderUi
    }

}