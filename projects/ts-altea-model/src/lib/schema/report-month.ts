import { Type } from "class-transformer";
import { PaymentType, TaxLine } from "ts-altea-model";
import { HtmlTable, ObjectWithIdPlus } from "ts-common";
import * as _ from "lodash";

export class ReportCash {
    in: number = 0
    out: number = 0
    toBank: number = 0
}

export class ReportTax {
    constructor(public tax: number = 0, public excl: number = 0, public incl: number = 0) {

    }
}

export class RowMaps {

    cols: string[] = []

    rows: Map<string, any>[] = []

    addColumn(colName: string) {

        if (this.cols.indexOf(colName) == -1)
            this.cols.push(colName)

    }

    addColumns(...colNames: string[]) {

        for (let colName of colNames)
            this.addColumn(colName)
    }

}

export class ReportMonths {

    lines: ReportMonth[] = []

    constructor(lines: ReportMonth[]) {
        this.lines = lines
    }


    toHtmlTable(): HtmlTable {

        let table = new HtmlTable()

        let rowMaps = this.toRowMaps()

        let headers: string[] = []
        table.addRow(headers)

        table.headerRow = true

        table.styles.th = "padding-right:20px"

        for (let col of rowMaps.cols) {
            headers.push(col)
        }

        for (let row of rowMaps.rows) {

            let cols: string[] = []
            table.addRow(cols)

            for (let col of rowMaps.cols) {

                if (row.has(col))
                    cols.push(row.get(col))
                else
                    cols.push('')
            }
        }


        return table

    }

    toRowMaps(): RowMaps {

        const rowMaps = new RowMaps()

        rowMaps.addColumn('year')
        rowMaps.addColumn('month')

        for (let line of this.lines) {

            let row = new Map<string, any>()
            rowMaps.rows.push(row)

            row.set('year', line.year)
            row.set('month', line.month)

            /** Incoming amounts: there is a total and an amount per payment type (cash, credit,...) */
            Object.keys(line.inc).forEach(type => {
                let colName = `inc-${type}`
                rowMaps.addColumn(colName)
                row.set(colName, line.inc[type])
            })

            
            Object.keys(line.tax).forEach(pct => {

                let colName = `tax-${pct}`
               // rowMaps.addColumn(colName)
                let value = line.tax[pct]

                if (value) {
                    let reportTax = value as ReportTax

                    rowMaps.addColumns(`${colName}-excl`, `${colName}-incl`, `${colName}-tax`)
                    row.set(`${colName}-excl`, reportTax.excl)
                    row.set(`${colName}-incl`, reportTax.incl)
                    row.set(`${colName}-tax`, reportTax.tax)
                }
            })
            
        }

        return rowMaps
    }
}

export class ReportMonth extends ObjectWithIdPlus {

    constructor(orgId?: string, branchId?: string, year: number = 2000, month: number = 1) {
        super()

        this.orgId = orgId
        this.branchId = branchId

        this.year = year
        this.month = month
    }

    orgId?: string
    branchId?: string

    year: number
    month: number

    tax = {}

    /** incoming payments */
    inc = {}

    /** outgoing payments */
    out = {}

    @Type(() => ReportCash)
    cash: ReportCash = new ReportCash()


    /**
     * Initializes all values, in order to rebuild from zero.
     */
    reset() {
        this.tax = {}
        this.inc = {}
        this.out = {}
        this.cash = new ReportCash()

    }

    increaseTotalInc(amount: number) {

        if (!this.inc)
            this.inc = {}

        if (!this.inc['total'])
            this.inc['total'] = 0

        this.inc['total'] += amount

    }

    increaseInc(type: PaymentType, amount: number) {

        if (!this.inc)
            this.inc = {}

        if (!this.inc[type])
            this.inc[type] = 0

        this.inc[type] += amount

    }

    addTax(line: TaxLine) {

        if (!this.tax)
            this.tax = {}

        let pct = line.pct
        if (!this.tax[pct])
            this.tax[pct] = new ReportTax()

        let taxReport: ReportTax = this.tax[pct]

        taxReport.excl = _.round(taxReport.excl + line.excl, 2)
        taxReport.tax = _.round(taxReport.tax + line.tax, 2)
        taxReport.incl = _.round(taxReport.incl + line.incl, 2)


    }
}


/*

ng generate service data-services/sql/reportMonth --project=ng-altea-common

*/