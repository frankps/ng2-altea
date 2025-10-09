import { Type } from "class-transformer";
import { Payment, PaymentType, TaxLine } from "ts-altea-model";
import { HtmlTable, ObjectHelper, ObjectWithIdPlus } from "ts-common";
import * as _ from "lodash";

export class ReportCash {
    in: number = 0
    out: number = 0
    toBank: number = 0
}

export class ReportTax {
    constructor(public tax: number = 0, public excl: number = 0, public incl: number = 0) {

    }

    subtract(other: ReportTax): ReportTax {

        let res = new ReportTax()

        if (!other)
            other = new ReportTax()

        res.tax = this.tax - other.tax
        res.incl = this.incl - other.incl
        res.excl = this.excl - other.excl

        return res

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

    incomeAddColumns(line: ReportMonth, payTypes: PaymentType[], totals: any, cols: string[]) {

        for (let bankType of payTypes) {

            if (!totals.payType[bankType])
                totals.payType[bankType] = 0

            let strVal = ''

            let value = line.inc[bankType]
            if (value) {
                totals.payType[bankType] += value
                strVal = `${value}`
            }

            cols.push(strVal)
        }

    }

    incomeReport(): HtmlTable {
        console.log('taxReport')

        let table = new HtmlTable()

        table.headerRow = true

        table.styles.th = "padding-right:30px"

        let bankTypes: PaymentType[] = [PaymentType.debit, PaymentType.credit, PaymentType.transfer, PaymentType.stripe]

        let otherTypes: PaymentType[] = [PaymentType.gift, PaymentType.loyal, PaymentType.subs, PaymentType.cash]

        let decimals = 0

        let header: string[] = []
        table.addRow(header)

        header.push('Year', 'Month', 'Version')

        let allTypes: PaymentType[] = [...bankTypes, ...otherTypes]

        for (let payType of allTypes) {
            header.push(payType)
        }

        header.push('nodecl', 'cash%')

        let totals = {
            payType: {},
            noDecl: 0
        }

        for (let line of this.lines) {
            let cols: string[] = []
            table.addRow(cols)

            cols.push(`${line.year}`, `${line.month}`, `${line.version}`)

            this.incomeAddColumns(line, allTypes, totals, cols)


            let strNoDecl = ''
            let noDecl = 0
            let pctgOfCash = 0

            if (line.noDecl) {
                noDecl = line.noDecl

                totals.noDecl += noDecl

                let cash = line.inc[PaymentType.cash]
                let noDeclPctg = _.round(100 * noDecl / cash, 0)

                cols.push(`${noDecl}`, `<i>${noDeclPctg}%</i>`)
            }




        }

        let footer: string[] = []
        table.addRow(footer)
        footer.push('<b>Total</b>', '', '')

        let totalIn = 0
        let totalBankIn = 0

        for (let payType of allTypes) {

            let isBank = bankTypes.indexOf(payType) >= 0

            let payTypeTotal = totals.payType[payType]
            let strTotal = ''

            if (payTypeTotal) {
                strTotal = `<b>${payTypeTotal}</b>`
                totalIn += payTypeTotal

                if (isBank)
                    totalBankIn += payTypeTotal
            }


            footer.push(strTotal)
        }

        let totalNoDecl = _.round(totals.noDecl, decimals)
        let pctgNoDecl = _.round(100 * totals.noDecl / totals.payType[PaymentType.cash], decimals)
        footer.push(`<b>${totalNoDecl}</b>`, `<i>${pctgNoDecl}%</i>`)

        let footer2: string[] = []
        table.addRow(footer2)
        footer2.push('<i>% of total</i>', '', '')

        for (let payType of allTypes) {

            let total = totals.payType[payType]
            let strTotalPctg = ''

            if (total) {
                let pctgOfTotal = _.round((total / totalIn) * 100, 1)
                strTotalPctg = `${pctgOfTotal}%`
            }


            footer2.push(strTotalPctg)
        }

        let noDeclPctgOfTotal = _.round(100 * totalNoDecl / totalIn, 1)
        footer2.push(`<i>${noDeclPctgOfTotal}%</i>`)

        return table
    }

    taxReport(decimalSeparator: string = '.'): HtmlTable {

        console.log('taxReport')

        let table = new HtmlTable()

        table.headerRow = true

        table.styles.th = "padding-right:30px"

        let header: string[] = []
        table.addRow(header)

        let pctgs = [6, 12, 21]
        header.push('Year', 'Month', 'Version')

        for (let pctg of pctgs) {
            header.push(`${pctg}% Incl`, `${pctg}% Excl`, `${pctg}% Vat`)
        }

        header.push('TotalIncl')

        let totals = {
            incl: {},
            excl: {},
            vat: {}
        }


        for (let line of this.lines) {

            let cols: string[] = []
            table.addRow(cols)

            cols.push(`${line.year}`, `${line.month}`, `${line.version}`)

            let lineTotalIncl = 0

            for (let pctg of pctgs) {
                let pctTaxLine: TaxLine = line.tax[pctg]

                let incl = 0

                if (pctTaxLine) {
                    incl = pctTaxLine.incl
                    lineTotalIncl += incl
                }
                let excl = _.round(incl / (1 + pctg / 100), 2)
                let vat = _.round(incl - excl, 2)

                let inclStr = `${incl}`.replace('.',decimalSeparator)
                let exclStr = `${excl}`.replace('.',decimalSeparator)
                let vatStr = `${vat}`.replace('.',decimalSeparator)

                cols.push(inclStr, exclStr, vatStr)



                if (!totals.incl[pctg]) totals.incl[pctg] = 0
                if (!totals.excl[pctg]) totals.excl[pctg] = 0
                if (!totals.vat[pctg]) totals.vat[pctg] = 0

                totals.incl[pctg] = _.round(totals.incl[pctg] + incl, 2)
                totals.excl[pctg] = _.round(totals.excl[pctg] + excl, 2)
                totals.vat[pctg] = _.round(totals.vat[pctg] + vat, 2)
            }

            lineTotalIncl = _.round(lineTotalIncl, 2)
            let lineTotalInclStr = `${lineTotalIncl}`.replace('.',decimalSeparator)
            cols.push(`<b>${lineTotalInclStr}</b>`)
        }

        let footer: string[] = []
        table.addRow(footer)


        footer.push('Total', '', '')


        let totalIncl = 0
        let totalExcl = 0
        let totalVat = 0

        for (let pctg of pctgs) {
            totalVat = _.round(totalVat + totals.vat[pctg], 2)
            totalIncl = _.round(totalIncl + totals.incl[pctg], 2)
            totalExcl = _.round(totalExcl + totals.excl[pctg], 2)

            footer.push(`<b>${totals.incl[pctg]}</b>`, `<b>${totals.excl[pctg]}</b>`, `<b>${totals.vat[pctg]}</b>`)


        }


        let footer2: string[] = []
        table.addRow(footer2)

        footer2.push('% of total', '', '')

        for (let pctg of pctgs) {

            let pctgOfTotal = _.round((totals.incl[pctg] / totalIncl) * 100, 1)

            footer2.push(`<i>${pctgOfTotal}%</i>`, '', '')
        }

        let footer3: string[] = []
        table.addRow(footer3)

        totalVat = _.round(totalVat, 0)
        totalIncl = _.round(totalIncl, 0)
        totalExcl = _.round(totalExcl, 0)
        footer3.push('Total', 'all %', '', `<b>${totalIncl}</b>`, `<b>${totalExcl}</b>`, `<b>${totalVat}</b>`)

        return table

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


    addMonthToRow(line: ReportMonth, rowMaps: RowMaps, row: Map<string, any>) {

        row.set('noDecl', line.noDecl)

        /** Incoming amounts: there is a total and an amount per payment type (cash, credit,...) */
        Object.keys(line.inc).forEach(type => {
            let colName = `inc-${type}`
            rowMaps.addColumn(colName)
            let val = _.round(line.inc[type], 2)
            row.set(colName, val)
        })

        Object.keys(line.tax).forEach(pct => {

            let colName = `tax-${pct}`
            // rowMaps.addColumn(colName)
            let value = line.tax[pct]

            if (value) {
                let reportTax = value as ReportTax

                rowMaps.addColumns(`${colName}-excl`, `${colName}-incl`, `${colName}-tax`)
                row.set(`${colName}-excl`, _.round(reportTax.excl, 2))
                row.set(`${colName}-incl`, _.round(reportTax.incl, 2))
                row.set(`${colName}-tax`, _.round(reportTax.tax, 2))
            }
        })
    }

    toRowMaps(): RowMaps {

        const rowMaps = new RowMaps()

        rowMaps.addColumn('year')
        rowMaps.addColumn('month')
        rowMaps.addColumn('version')
        rowMaps.addColumn('noDecl')

        let firstLine = true
        let previousLine: ReportMonth


        for (let line of this.lines) {

            if (!firstLine) {
                if (previousLine && previousLine.month == line.month && previousLine.year == line.year) {

                    let deltaRow = new Map<string, any>()
                    rowMaps.rows.push(deltaRow)

                    let diff = previousLine.subtract(line)

                    this.addMonthToRow(diff, rowMaps, deltaRow)
                    //row.set('noDecl', line.noDecl)
                    //deltaRow.set('year', line.year)
                }
            }

            let row = new Map<string, any>()
            rowMaps.rows.push(row)

            row.set('year', line.year)
            row.set('month', line.month)
            row.set('version', line.version)



            this.addMonthToRow(line, rowMaps, row)


            previousLine = line
            firstLine = false



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
        this.yearMonth = year * 100 + month
    }

    latest: boolean = true
    version: number = 0

    orgId?: string
    branchId?: string

    yearMonth: number
    year: number
    month: number

    tax = {}

    /** incoming payments */
    inc = {}

    /** outgoing payments */
    out = {}

    @Type(() => ReportCash)
    cash: ReportCash = new ReportCash()

    noDecl = 0

    /**
     * Initializes all values, in order to rebuild from zero.
     */
    reset() {
        this.tax = {}
        this.inc = {}
        this.out = {}
        this.cash = new ReportCash()
    }

    subtract(other: ReportMonth): ReportMonth {

        let result = new ReportMonth(this.orgId, this.branchId, this.year, this.month)


        result.noDecl = this.noDecl - other.noDecl

        Object.keys(this.inc).forEach(key => {

            let a: number = this.inc[key] ? this.inc[key] : 0
            let b: number = other?.inc[key] ? other.inc[key] : 0

            result.inc[key] = a - b
        })

        Object.keys(this.tax).forEach(pct => {

            let taxReport1: ReportTax = this.tax[pct] ? ObjectHelper.clone(this.tax[pct], ReportTax) : new ReportTax()
            let taxReport2: ReportTax = other.tax[pct]  //?other.tax[pct]:new ReportTax()


            result.tax[pct] = taxReport1.subtract(taxReport2)
        })

        return result
    }

    increaseTotalInc(amount: number) {

        if (!this.inc)
            this.inc = {}

        if (!this.inc['total'])
            this.inc['total'] = 0

        this.inc['total'] = _.round(this.inc['total'] + amount)

    }

    increaseInc(type: PaymentType, amount: number) {

        if (!this.inc)
            this.inc = {}

        if (!this.inc[type])
            this.inc[type] = 0

        this.inc[type] = _.round(this.inc[type] + amount, 2)

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