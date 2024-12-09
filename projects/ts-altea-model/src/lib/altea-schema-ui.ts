/** Minimal object classes (subset of equivalent full classes, ex: OrderUi subset of Order):
 *  for read-only purposes, such as calendar
 * 
 *  Idea is to have read-only versions of each order in the Firebase database
 *  Each time an order is changed in the (Cockroach) SQL, we update the Firebase read-only version,
 *  from there it is pushed to the UIs
 * 
 */

import { Type } from "class-transformer"
import { ArrayHelper, DateHelper, ObjectWithId } from "ts-common"
import * as _ from "lodash";
import { OrderLineOptionValue, PlanningType, Resource, ResourcePlanning, ResourceType, OrderLineOption, OrderLine, OrderState, Contact, Order, Task } from "ts-altea-model";

export class ObjectUi {
    id: string

    constructor(id?: string) {
        if (id)
            this.id = id
    }
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

export class ResourceUi extends ObjectUi {
    name: string
    color?: string
    type?: ResourceType

    static fromResource(resource: Resource) {

        if (!resource)
            return null

        const resourceUi = new ResourceUi()
        resourceUi.id = resource.id
        resourceUi.name = resource.name
        resourceUi.color = resource.color
        resourceUi.type = resource.type

        return resourceUi
    }
}


export class ResourcePlanningUi extends ObjectUi {
    start?: number
    end?: number
    prep: boolean = false
    type: PlanningType

    @Type(() => ResourceUi)
    resource: ResourceUi | ObjectUi | Resource

    order?: OrderUi

    get startDate() {
        return DateHelper.parse(this.start)
    }

    get endDate() {
        return DateHelper.parse(this.end)
    }

    static fromResourcePlanning(planning: ResourcePlanning): ResourcePlanningUi {

        if (!planning)
            return null

        const planningUi = new ResourcePlanningUi()
        planningUi.id = planning.id
        planningUi.start = planning.start
        planningUi.end = planning.end
        planningUi.prep = planning.prep
        planningUi.type = planning.type

        if (planning.resource)
            planningUi.resource = ResourceUi.fromResource(planning.resource)
        else
            planningUi.resource = new ObjectUi(planning.resourceId)

        return planningUi

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

    shortInfo() {

        let optionVals

        if (ArrayHelper.NotEmpty(this.values)) {
            let vals = this.values.map(val => val.name).filter(val => val != '0')
            optionVals = vals.join(', ')
        }

        if (optionVals)
            return `${this.name}: ${optionVals}`
        else return null
    }
}

export class OrderLineUi extends ObjectUi {
    qty: number
    descr?: string;

    @Type(() => OrderLineOptionUi)
    options: OrderLineOptionUi[] = []

    shortInfo(options = false, separator: string = ' ', indent = '&nbsp;&nbsp;'): string {
        let info = ''

        if (this.qty && this.qty > 1)
            info += '' + this.qty + 'x'

        if (this.descr)
            info += this.descr

        if (options && ArrayHelper.NotEmpty(this.options)) {
            let optInfos = this.options.map(option => option.shortInfo()).filter(opt => opt != null).map(opt => indent + opt)
            let optInfo = optInfos.join(separator)
            info += separator + optInfo
        }

        return info
    }

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

    @Type(() => ResourcePlanningUi)
    planning: ResourcePlanningUi[] = []

    start?: number; // format: yyyyMMddHHmmss
    end?: number; // format: yyyyMMddHHmmss

    paid = 0
    deposit = 0
    incl = 0
    state?: OrderState

    /** if not specified, it is an order. Otherwise it is a task */
    type?: '' | 'order'| 'task' = ''

    get startDate() {
        return DateHelper.parse(this.start)
    }

    get endDate() {
        return DateHelper.parse(this.end)
    }



    shortInfo(contact = true, pay = true, options = false, separator: string = ' '): string {

        let info = '#'
        let isOrder = (this.type == '' || this.type == 'order')

        if (isOrder && contact && this.contact)
            info += this.contact.name

        if (ArrayHelper.NotEmpty(this.lines)) {

            let lineInfos = this.lines.map(line => line.shortInfo(options, separator))
            lineInfos = _.uniq(lineInfos)
            let lineInfo = lineInfos.join(separator)
            info += ` ${lineInfo}`
        }

        if (isOrder && pay)
            info += ` €${this.paid}/${this.incl}`

        return info

    }

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
        orderUi.state = order.state

        if (order.contact)
            orderUi.contact = ContactUi.fromContact(order.contact)

        if (ArrayHelper.NotEmpty(order.lines))
            orderUi.lines = order.lines.map(line => OrderLineUi.fromOrderLine(line))

        if (ArrayHelper.NotEmpty(order.planning))
            orderUi.planning = order.planning.map(plan => ResourcePlanningUi.fromResourcePlanning(plan))

        return orderUi
    }

    static fromTask(task: Task): OrderUi {

        if (!task)
            return null

        const orderUi = new OrderUi()
        orderUi.id = task.id
        orderUi.type = 'task'

        let startDate = task.startDate()
        let endDate = task.endDate()

        orderUi.start = DateHelper.yyyyMMddhhmmss(startDate)
        orderUi.end = DateHelper.yyyyMMddhhmmss(endDate)

        const lineUi = new OrderLineUi()
        lineUi.id = task.id
        lineUi.qty = 1
        lineUi.descr = task.name

        orderUi.lines = [lineUi]

        if (ArrayHelper.NotEmpty(task.planning))
            orderUi.planning = task.planning.map(plan => ResourcePlanningUi.fromResourcePlanning(plan))

        return orderUi
    }


}