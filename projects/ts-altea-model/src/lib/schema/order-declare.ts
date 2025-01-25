/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ApiListResult, ApiStatus, ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, NumberHelper, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper, YearMonth } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";
import { Branch, Contact, Currency, DepositMode, Invoice, InvoiceTotals, Order, OrderLine, OrderLineSummary, OrderType, Organisation, Payment, PaymentType, PlanningMode, Product, ProductSubType, ProductType, Resource, ResourcePlanning, Subscription, TaxLine, TaxLines, VatLine } from "ts-altea-model";


export class DeclareLine {

    /** each declare line is focused on a certain percentage */
    pct: number

    /** Total to declare for this order and for this percentage */
    total: VatLine

    /** Total already declared */
    declared: TaxLine

    /*
        toDeclareExcl: number = 0
    
        toDeclareIncl: number = 0
    */

    /** indexed by period (number in format yymm) */
    newDeclares: Map<number, number> = new Map<number, number>()

    constructor(pct: number) {
        this.pct = pct
        this.total = new VatLine(pct)
    }

    static init(vatLine: VatLine): DeclareLine {

        let declareLine = new DeclareLine(vatLine.pct)
        declareLine.total = vatLine

        return declareLine
    }

    hasNewDeclares(): boolean {

        let hasNew = this.newDeclares && this.newDeclares.size > 0

        return hasNew

    }

    sumNewDeclares(): number {

        if (!this.newDeclares || this.newDeclares.size == 0)
            return 0

        let values = Array.from(this.newDeclares.values())

        let total = _.sum(values)

        return total
    }

    addNewDeclare(period: number, amount: number) {

        let current = 0

        if (this.newDeclares.has(period))
            current = this.newDeclares.get(period)

        let newAmount = _.round(current + amount, 2)

        this.newDeclares.set(period, newAmount)

    }


    /*
    openAmountExcl() {

        let toDeclare = this.total ? this.total.excl : 0
        let declared = this.declared ? this.declared.excl : 0

        return _.round(toDeclare - declared - this.toDeclareExcl, 2)
    }*/

    openAmountIncl(): number {

        let toDeclare = this.total ? this.total.incl : 0

        /** Total already declared in the past (frozen period) */
        let declared = this.declared ? this.declared.incl : 0

        /** New declares during this run */
        let newDeclares = this.sumNewDeclares()

        return _.round(toDeclare - declared - newDeclares, 2)
    }

    declaredAmountIncl(): number {
        /** Total already declared in the past (frozen period) */
        let declared = this.declared ? this.declared.incl : 0

        /** New declares during this run */
        let newDeclares = this.sumNewDeclares()

        return _.round(declared + newDeclares, 2)
    }


}

export class OrderDeclareResult {

    status: ApiStatus = ApiStatus.notProcessed

    msg: string

    constructor(status: ApiStatus = ApiStatus.notProcessed, msg?: string) {
        this.status = status
        this.msg = msg
    }

    static ok(msg?: string): OrderDeclareResult {

        let res = new OrderDeclareResult(ApiStatus.ok, msg)
        return res
    }

    static warning(msg?: string): OrderDeclareResult {

        let res = new OrderDeclareResult(ApiStatus.warning, msg)
        return res
    }

    static error(msg?: string): OrderDeclareResult {

        let res = new OrderDeclareResult(ApiStatus.error, msg)
        return res
    }

    isOk(): boolean {
        return this.status == ApiStatus.ok
    }

}

export class OrderDeclare {

    vatMap = new Map<number, DeclareLine>()

    constructor(public order: Order) {

    }

    static init(order: Order, vatLines: VatLine[]): OrderDeclare {

        let orderDeclare = new OrderDeclare(order)

        if (ArrayHelper.IsEmpty(vatLines))
            return orderDeclare

        let declareLines = vatLines.map(vl => DeclareLine.init(vl))

        orderDeclare.vatMap = new Map(declareLines.map(dl => [dl.pct, dl]))

        return orderDeclare
    }


    setAlreadyDeclared(tax: TaxLines) {

        if (!tax || !tax.hasLines())
            return

        if (!this.vatMap)
            this.vatMap = new Map<number, DeclareLine>()

        tax = tax.sumByPct()

        for (let taxLine of tax.lines) {
            let declareLine = this.vatMap.get(taxLine.pct)

            if (!declareLine) {
                declareLine = new DeclareLine(taxLine.pct)
                this.vatMap.set(taxLine.pct, declareLine)
            }

            declareLine.declared = taxLine
        }
    }

    /**
     * 
     * @returns percentages where declared < orderTax, ordered desc (=> pop lowest pct's first)
     */
    getAvailablePercentages(): number[] {

        if (!this.vatMap || this.vatMap.size == 0)
            return []

        let declareLines: DeclareLine[] = Array.from(this.vatMap.values())

        declareLines = declareLines.filter(l => l.openAmountIncl() > 0)

        let pcts = declareLines.map(l => l.pct)

        // desc because we will pop from array, and we want to pop lowest first
        pcts = _.orderBy(pcts, [], 'desc')

        return pcts
    }


    /**
 * 
 * @returns percentages where declared > 0, ordered asc  (=> pop highest pct's first)
 */
    getDeclaredPercentages(): number[] {

        if (!this.vatMap || this.vatMap.size == 0)
            return []

        let declareLines: DeclareLine[] = Array.from(this.vatMap.values())

        declareLines = declareLines.filter(l => l.declaredAmountIncl() > 0)

        let pcts = declareLines.map(l => l.pct)

        // asc because we will pop from array, and we want to pop highest first
        pcts = _.orderBy(pcts, [], 'asc')

        return pcts
    }


    declarePositive(pays: Payment[]): OrderDeclareResult {

        if (ArrayHelper.IsEmpty(pays))
            return OrderDeclareResult.ok('No payments to process')

        /** normalAllocation = when we can allocate all maounts to available vat (from orderlines) */
        let normalAllocation: boolean = true

        let pcts = this.getAvailablePercentages()

        let pct = pcts.pop()

        if (!pct) {
            pct = this.order.dominantVatPct(6)
            normalAllocation = false
        }

        let declareLine = this.getDeclareLine(pct)

        for (let pay of pays) {

            let toDeclare = _.round(pay.amount - pay.noDecl, 2)
            let period = pay.declarationPeriod()

            while (toDeclare > 0) {

                if (!declareLine) {
                    return OrderDeclareResult.error(`No declaration line available for payment ${pay.amount}`)
                }

                let openIncl = declareLine.openAmountIncl()

                if (normalAllocation && openIncl <= 0)
                    return OrderDeclareResult.error(`${pct}% vat: open amount ${openIncl} is negative!`)

                let newDeclare = 0

                if (normalAllocation) {
                    if (toDeclare <= openIncl)
                        newDeclare = toDeclare
                    else // toDeclare > openIncl
                        newDeclare = openIncl
                } else {
                    newDeclare = toDeclare
                }


                declareLine.addNewDeclare(period, newDeclare)   //toDeclareIncl = _.round(declareLine.toDeclareIncl + newDeclare, 2)
                toDeclare = _.round(toDeclare - newDeclare, 2)
                openIncl = _.round(openIncl - newDeclare, 2)

                if (normalAllocation && openIncl == 0) {  // then we have consumed available amount for percentage => use next percentage
                    pct = pcts.pop()

                    if (!pct) {
                        pct = this.order.dominantVatPct(21)
                        normalAllocation = false
                    }

                    declareLine = this.getDeclareLine(pct)
                }

            }
        }

        return OrderDeclareResult.ok()
    }

    getDeclareLine(pct: number, createIfNotExisting: boolean = true): DeclareLine {

        let declareLine = this.vatMap.get(pct)

        if (!declareLine && createIfNotExisting) {
            declareLine = new DeclareLine(pct)
            this.vatMap.set(pct, declareLine)
        }

        return declareLine
    }

    declareNegative(pays: Payment[]): OrderDeclareResult {

        if (ArrayHelper.IsEmpty(pays))
            return OrderDeclareResult.ok('No payments to process')

        let normalAllocation: boolean = true

        let pcts = this.getDeclaredPercentages()

        let pct = pcts.pop()

        if (!pct) {
            pct = this.order.dominantVatPct(21)
            normalAllocation = false
        }

        let declareLine = this.getDeclareLine(pct)


        for (let pay of pays) {

            let toReclaim = _.round(Math.abs(pay.amount - pay.noDecl), 2)
            let period = pay.declarationPeriod()

            while (toReclaim > 0) {

                if (!declareLine) {
                    return OrderDeclareResult.error(`No declaration line available for payment ${pay.amount}`)
                }

                let declIncl = declareLine.declaredAmountIncl()

                if (normalAllocation && declIncl <= 0)
                    return OrderDeclareResult.error(`${pct}% vat: open amount ${declIncl} is negative!`)

                let newReclaim = 0


                if (normalAllocation) {
                    if (toReclaim <= declIncl)
                        newReclaim = toReclaim
                    else // toDeclare > openIncl
                        newReclaim = declIncl
                } else {
                    newReclaim = toReclaim
                }



                declareLine.addNewDeclare(period, -newReclaim)   //toDeclareIncl = _.round(declareLine.toDeclareIncl + newDeclare, 2)
                toReclaim = _.round(toReclaim - newReclaim, 2)
                declIncl = _.round(declIncl - newReclaim, 2)

                if (normalAllocation && declIncl == 0) {  // then we have consumed available amount for percentage => use next percentage
                    pct = pcts.pop()

                    if (!pct) {
                        pct = this.order.dominantVatPct(21)
                        normalAllocation = false
                    }

                    declareLine = this.getDeclareLine(pct)
                }

            }
        }

        return OrderDeclareResult.ok()
    }



    updateLines(taxLines: TaxLines, asFromPeriod: number) {  // , orderDeclare: OrderDeclare

        let declareLines: DeclareLine[] = Array.from(this.vatMap.values())

        declareLines = declareLines.filter(l => l.hasNewDeclares())

        // initially: we only keep already fixed lines
        taxLines.lines = taxLines.lines.filter(l => l.per < asFromPeriod)

        if (ArrayHelper.IsEmpty(declareLines))
            return

        let newTaxLines = []

        for (let declareLine of declareLines) {

            let pct = declareLine.pct

            let periods = Array.from(declareLine.newDeclares.keys())


            for (let period of periods) {

                let valueToDeclareIncl = declareLine.newDeclares.get(period)

                let excl = _.round(valueToDeclareIncl / (1 + pct / 100), 2)
                let tax = _.round(valueToDeclareIncl - excl, 2)

                let taxLine = new TaxLine(period, pct, tax, excl, valueToDeclareIncl)
                newTaxLines.push(taxLine)

            }
        }

        taxLines.lines.push(...newTaxLines)

    }




}

