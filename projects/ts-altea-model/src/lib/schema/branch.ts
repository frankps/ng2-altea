


import { Contact, DepositMode, Gender, Gift, GiftConfig, Invoice, LoyaltyCard, MsgInfo, MsgType, Order, OrderLine, OrderType, Organisation, PlanningMode, Product, ProductResource, ProductType, ResourcePlanning, Schedule, Subscription, TimeUnit, TimeUnitHelper, User, UserBase } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";


/** DepositTerms define how much time a customer has to pay for a reservation (pt=payment term) 
 * based on how long the booking was made upfront (bt=before time)   */
export class DepositTerm {

    /** before time: time between reservation made and effective date of reservation */
    bt: number = 0

    /** before time unit: (d)ays, (h)ours, (m)inutes */
    btu: string = 'd'

    /** payment term: the time a customer has to pay for his reservation */
    pt: number = 0

    /** payment term unit: (d)ays, (h)ours, (m)inutes */
    ptu: string = 'h'
}


export class ReminderConfig {
    type: MsgType = MsgType.email

    dur: number = 1

    unit: TimeUnit = TimeUnit.days

    seconds(): number {
        return TimeUnitHelper.numberOfSeconds(this.unit) * this.dur
    }

    toMsgInfo(appointmentDate: Date): MsgInfo {
        const seconds = this.seconds()
        const remindeOn = dateFns.addSeconds(appointmentDate, -seconds)

        const reminder = new MsgInfo(remindeOn, this.type, 'reminder')
        return reminder
    }
}


export class Branch extends ObjectWithIdPlus {

    orders?: Order[];

    @Type(() => Number)
    idx = 0

    //@Type(() => Organisation)
    organisation?: Organisation;

    @Type(() => Contact)
    contacts?: Contact[]


    orgId?: string;
    name?: string;
    unique?: string;
    short?: string;
    descr?: string;
    str?: string;
    strNr?: string;
    postal?: string;
    country?: string;

    phone?: string
    mobile?: string
    email?: string

    /** currency */
    cur?: string = 'EUR'

    city?: string;
    lang?: string;
    emailFrom?: string;
    emailBcc?: string;

    vatIncl = true

    @Type(() => Number)
    vatPct = 0

    @Type(() => Number)
    vatPcts?: number[];

    vatNr?: string

    smsOn = false

    /** min number of hours before reservation for free cancel (0 = always free cancel, 24 = 1 day upfront for free cancel, ...) */
    @Type(() => Number)
    cancel: number = 0

    /** default deposit percentage, can be overruled on product & contact level */
    @Type(() => Number)
    depositPct?: number

    //  @Type(() => DepositTerm)
    depositTerms?: DepositTerm[]

    //  @Type(() => ReminderConfig)
    reminders?: ReminderConfig[]

    /** this branch uses the gift functionality */
    giftOn = false

    //  @Type(() => GiftConfig)
    gift?: GiftConfig


    get sameDayTerm(): number { return this.getDepositTerm(0) }
    set sameDayTerm(value: number) { this.setDepositTerm(0, value) }

    get nextDayTerm(): number { return this.getDepositTerm(1) }
    set nextDayTerm(value: number) { this.setDepositTerm(1, value) }

    get nextWeekTerm(): number { return this.getDepositTerm(7) }
    set nextWeekTerm(value: number) { this.setDepositTerm(7, value) }

    get nextMonthTerm(): number { return this.getDepositTerm(30) }
    set nextMonthTerm(value: number) { this.setDepositTerm(30, value) }


    // 
    //nextDayTerm: number = 5

    hasReminders() {
        return (Array.isArray(this.reminders) && this.reminders.length > 0)
    }

    getDepositTerm(beforeTime: number, beforeUnit: string = 'd') {
        if (!Array.isArray(this?.depositTerms))
            return null

        const term = this?.depositTerms.find(dt => dt.bt == beforeTime && dt.btu == beforeUnit)

        if (!term)
            return null
        else
            return term.pt
    }

    setDepositTerm(beforeTime: number, depositTerm: number, beforeUnit: string = 'd') {

        if (!Array.isArray(this?.depositTerms))
            this.depositTerms = []

        if (!depositTerm) {
            _.remove(this?.depositTerms, t => t.bt == beforeTime && t.btu == beforeUnit)
            console.warn(this?.depositTerms)
            return

        }

        let term = this?.depositTerms.find(dt => dt.bt == beforeTime && dt.btu == beforeUnit)

        if (term) {
            term.pt = depositTerm
        }
        else {


            term = new DepositTerm()

            term.bt = beforeTime
            term.btu = beforeUnit
            term.pt = depositTerm

            this.depositTerms.push(term)
        }

        console.error(term)
        console.warn(this?.depositTerms)
    }

}

