import { ArrayHelper, DateHelper, ObjectHelper, ObjectWithId, ObjectWithIdPlus } from "ts-common";
import * as dateFns from 'date-fns'
import { Exclude, Type } from "class-transformer";
import * as _ from "lodash";
import { Payment } from "ts-altea-model";

export enum BankTxType {
    unknown = 'unknown',
    stripe = 'stripe',
    transfer = 'transfer',
    terminalBC = 'terminalBC',
    terminalCredit = 'terminalCredit',
    onlineBC = 'onlineBC',
    onlineCredit = 'onlineCredit',
    unidentifiedCredit = 'unidentifiedCredit'
}

export class BankTxInfo {

    type: BankTxType
    forDate: number // format yyyyMMdd

    orig?: number
    cost?: number

    constructor(type: BankTxType) {
        this.type = type
    }

    forDateTime() {
        return DateHelper.parse(this.forDate)
    }
}

export class BankTransaction extends ObjectWithId {


    accountId?: string

    /** TransactionNum, format yyyy-nnnnnnnn */
    num?: string
    numInt?: number

    /** Execution Date: format yyyyMMdd */
    execDate?: number

    /** Value Date: format yyyyMMdd */
    valDate?: number

    /** Reference Date: format yyyyMMdd */
    refDate?: number


    amount?: number

    /** original amount */
    orig?: number

    cost?: number

    check?: number

    /* currency */
    cur?: string


    /** CounterpartAccount */
    remoteAccount?: string

    /** CounterpartName */
    remoteName?: string

    details?: string

    ok: boolean = false

    createdAt = new Date()
    shortInfo?: string
    info?: string
    type?: BankTxType

    providerRef?: string

    /** data retrieved from provider (ex Stripe) related to this payment */
    prov?: any

    @Type(() => Payment)
    payments?: Payment[] = []

    clone() : BankTransaction {
        let clone = ObjectHelper.clone(this, BankTransaction)
        delete clone._info1

        return clone
    }

    amountRounded() : number {
        return _.round(this.amount, 2)
    }

    amountToLink() : number {

        let amount = this.amount

        if (this.type == BankTxType.terminalCredit || this.type == BankTxType.stripe)
            amount = this.orig

        return _.round(amount, 2)
    }

    getYearFromNum() : number {

        if (!this.num) 
            return -1

        let items = this.num.split('-')

        if (ArrayHelper.IsEmpty(items))
            return -1

        return +items[0]
    }

    getSequenceNumberFromNum() : number {

        if (!this.num) 
            return -1

        let items = this.num.split('-')

        if (ArrayHelper.IsEmpty(items))
            return -1

        return +items[1]
    }

    @Exclude()
    _execDate?: Date
    execDateObject(): Date {

        if (!this.execDate)
            return null

        if (!this._execDate)
            this._execDate = DateHelper.parse(this.execDate)

        return this._execDate
    }


    @Exclude()
    _refDate?: Date
    refDateObject(): Date {

        if (!this.refDate)
            return null

        if (!this._refDate)
            this._refDate = DateHelper.parse(this.refDate)

        return this._refDate
    }

    @Exclude()
    _info1: string = null

    info1(): string {

        if (this._info1 != null)
            return this._info1


        const refDate = this.refDateObject()

        let info1 = ''

        if (refDate) {
            info1 += dateFns.format(refDate, 'd/M')
        }

        if (this.type) {

            const type = this.type.toLowerCase()

            if (this.cost > 0 && (type == "kredietkaart" || type.indexOf('credit') >= 0 || type.indexOf('stripe') >= 0)) {

                info1 += ` = ${this.orig} - ${this.cost}`
            }
        }

        this._info1 = info1

        return info1
    }
}
