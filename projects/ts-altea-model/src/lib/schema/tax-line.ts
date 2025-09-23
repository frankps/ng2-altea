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

    @Type(() => TaxLine)
    lines: TaxLine[] = []

    constructor(lines?: TaxLine[]) {
        if (ArrayHelper.NotEmpty(lines))
            this.lines = lines
    }

    static empty(): TaxLines {
        return new TaxLines()
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

    /*
      hasVatLines(atLeast: number = 1): boolean {
    
        if (!Array.isArray(this.vatLines))
          return false
    
        let length = this.vatLines.length
    
        return length >= 1
      }
    
      totalVatIncl() {
        if (!this.vatLines)
          return 0
        
        return _.sumBy(this.vatLines, 'incl')
      }
        */

    hasLines(atLeast: number = 1): boolean {
        if (ArrayHelper.IsEmpty(this.lines))
            return false

        let length = this.lines.length

        return length >= atLeast

    }

    totalIncl() {
        if (!this.lines)
            return 0

        return _.sumBy(this.lines, 'incl')
    }

    totalYearMonthIncl(yearMonth: YearMonth) {
        if (!this.lines)
            return 0

        let yearMonthNum = yearMonth.toNumber()

        let scope = this.lines.filter(t => t.per == yearMonthNum)


        if (ArrayHelper.IsEmpty(scope))
            return 0

        return _.sumBy(scope, 'incl')
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
