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
import { Branch, Contact, Currency, DepositMode, Invoice, InvoiceTotals, Order, OrderLine, OrderLineSummary, OrderType, Organisation, Payment, PaymentType, PlanningMode, Product, ProductSubType, ProductType, Resource, ResourcePlanning, Subscription } from "ts-altea-model";


export class VatLine {

    constructor(public pct: number = 0, public vat: number = 0, public excl: number = 0, public incl: number = 0) {

    }

    clone(): VatLine {
        return new VatLine(this.pct, this.vat, this.excl, this.incl)
    }

}


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

    openAmountIncl() {

        let toDeclare = this.total ? this.total.incl : 0
        let declared = this.declared ? this.declared.incl : 0
        let newDeclares = this.sumNewDeclares()

        return _.round(toDeclare - declared - newDeclares, 2)
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

    static init(vatLines: VatLine[]): OrderDeclare {

        let orderDeclare = new OrderDeclare()

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
     * @returns percentages where declared < orderTax, ordered desc
     */
    getAvailablePercentages(): number[] {

        if (!this.vatMap || this.vatMap.size == 0)
            return []

        let declareLines: DeclareLine[] = Array.from(this.vatMap.values())

        declareLines = declareLines.filter(l => l.openAmountIncl() > 0)

        let pcts = declareLines.map(l => l.pct)

        pcts = _.orderBy(pcts, [], 'desc')

        return pcts
    }

    declare(pays: Payment[]): OrderDeclareResult {

        if (ArrayHelper.IsEmpty(pays))
            return OrderDeclareResult.ok('No payments to process')

        let pcts = this.getAvailablePercentages()

        let pct = pcts.pop()
        let declareLine = pct ? this.vatMap.get(pct) : null

        for (let pay of pays) {

            let toDeclare = _.round(pay.amount, 2)
            let period = pay.declarationPeriod()

            while (toDeclare > 0) {

                if (!declareLine) {
                    return OrderDeclareResult.error(`No declaration line available for payment ${pay.amount}`)
                }

                let openIncl = declareLine.openAmountIncl()

                if (openIncl <= 0)
                    return OrderDeclareResult.error(`${pct}% vat: open amount ${openIncl} is negative!`)

                let newDeclare = 0

                if (toDeclare <= openIncl)
                    newDeclare = toDeclare
                else // toDeclare > openIncl
                    newDeclare = openIncl


                declareLine.addNewDeclare(period, newDeclare)   //toDeclareIncl = _.round(declareLine.toDeclareIncl + newDeclare, 2)
                toDeclare = _.round(toDeclare - newDeclare, 2)
                openIncl = _.round(openIncl - newDeclare, 2)

                if (openIncl == 0) {  // then we have consumed available amount for percentage => use next percentage
                    pct = pcts.pop()
                    declareLine = pct ? this.vatMap.get(pct) : null
                }

            }
        }

        return OrderDeclareResult.ok()
    }



}




export class TaxLine {

    /**
     * 
     * @param per Tax period: number in format yymm (ex. 2501 = january 2025)
     * @param pct 
     * @param tax 
     * @param excl 
     */
    constructor(public per: number, public pct: number, public tax: number, public excl: number, public incl: number) {

    }

    clone(): TaxLine {
        return new TaxLine(this.per, this.pct, this.tax, this.excl, this.incl)
    }

    add(line: TaxLine) {

    }



}


export class TaxLines {

    lines: TaxLine[] = []

    constructor(lines?: TaxLine[]) {
        if (ArrayHelper.NotEmpty(lines))
            this.lines = lines
    }

    static empty(): TaxLines {
        return new TaxLines()
    }

    updateLines(asFromPeriod: number, orderDeclare: OrderDeclare) {

        let declareLines: DeclareLine[] = Array.from(orderDeclare.vatMap.values())

        declareLines = declareLines.filter(l => l.hasNewDeclares())

        // initially: we only keep already fixed lines
        this.lines = this.lines.filter(l => l.per < asFromPeriod)

        if (ArrayHelper.IsEmpty(declareLines))
            return

        let newTaxLines = []

        for (let declareLine of declareLines) {

            let pct = declareLine.pct

            let periods = Array.from(declareLine.newDeclares.keys())


            for (let period of periods) {

                let valueToDeclareIncl = declareLine.newDeclares.get(period)

                let excl = _.round(valueToDeclareIncl / (1 + pct/100), 2)
                let tax = _.round(valueToDeclareIncl - excl, 2)

                let taxLine = new TaxLine(period, pct, tax, excl, valueToDeclareIncl)
                newTaxLines.push(taxLine)

            }
        }

        this.lines.push(...newTaxLines)

    }

    sumByPct(): TaxLines {

        if (ArrayHelper.IsEmpty(this.lines))
            return new TaxLines()

        let map = new Map<number, TaxLine>()

        for (let line of this.lines) {

            let existing = map.get(line.pct)

            if (existing)
                existing.add(line)
            else
                map.set(line.pct, line.clone())
        }

        let lines = Array.from(map.values())

        return new TaxLines(lines)
    }



    hasLines(): boolean {
        return ArrayHelper.NotEmpty(this.lines)
    }

    getLines(yearMonth: YearMonth) {
        if (!this.hasLines())
            return TaxLines.empty()

        let yearMonthNum = yearMonth.toNumber()

        let scope = this.lines.filter(t => t.per == yearMonthNum)

        return new TaxLines(scope)
    }

    /**
     * 
     * @param untilYearMonth number in format yymm (example: 2503)
     * @returns 
     */
    getLinesUntil(untilYearMonth: number): TaxLines {
        if (!this.hasLines())
            return TaxLines.empty()

        let scope = this.lines.filter(t => t.per <= untilYearMonth)

        return new TaxLines(scope)
    }


    getLinesGroupedByPct(until?: YearMonth): TaxLines {

        if (!this.hasLines())
            return TaxLines.empty()

        let scope: TaxLines = this

        if (until) {
            let untilYearMonth = until.toNumber()
            scope = this.getLinesUntil(untilYearMonth)
        }

        let summed = scope.sumByPct()

        return summed
    }




}
