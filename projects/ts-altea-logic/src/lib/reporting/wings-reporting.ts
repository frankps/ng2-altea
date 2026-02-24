import { ArrayHelper, DateHelper, YearMonth } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { PaymentType, BankTransaction, Payment, ReportMonth, Order } from "ts-altea-model"
import * as dateFns from 'date-fns'
import * as _ from "lodash"
import * as ExcelJS from "exceljs";



const intl = new Intl.NumberFormat("en-US", {   //"nl-BE"
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

// Formats numbers for CSV with , as decimal and no thousands separator
function toCsvNumber(value: number, decimals = 2, showZero = false): string {

    if (value == 0 && !showZero)
        return ''

    return intl.format(value);
}

function toCsvDate(value: number): string {
    let date = DateHelper.parse(value)

    if (date)
        return dateFns.format(date, 'dd/MM HH:mm')
    else
        return ''
}

export class ExcelUrl {
    url: string
    text: string

    constructor(url: string, text: string) {
        this.url = url
        this.text = text
    }
}

export class WingsMonthReport {

    reportMonth: ReportMonth

    payments: WingsPaymentLine[] = []


    totals: Map<WingsPaymentType, number> = new Map<WingsPaymentType, number>()


    constructor() {
        this.payments = []
        this.totals.set(WingsPaymentType.bank, 0)
        this.totals.set(WingsPaymentType.cash, 0)
        this.totals.set(WingsPaymentType.gift, 0)
    }

    addPayment(payment: WingsPaymentLine) {
        this.payments.push(payment)
        this.totals.set(payment.type, (this.totals.get(payment.type) || 0) + payment.totalDeclared)
    }

    getLinesForOrder(orderId: string): WingsPaymentLine[] {
        return this.payments.filter(p => p.order.id == orderId)
    }

    toExcel(): ExcelJS.Workbook {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Wings')
        let row = 1

        // Row 1: header
        worksheet.getCell(row, 1).value = this.reportMonth.year
        worksheet.getCell(row, 2).value = this.reportMonth.month
        worksheet.getCell(row, 3).value = '%'
        worksheet.getCell(row, 4).value = 'excl'
        worksheet.getCell(row, 5).value = 'incl'
        worksheet.getCell(row, 6).value = 'tax'
        worksheet.getCell(row, 9).value = 'totals'
        row++

        const firstDataRow = row
        let lastDataRow = row - 1

        for (const pct of [6, 12, 21]) {
            let wingPaymentType = WingsPaymentType.bank
            switch (pct) {
                case 6: wingPaymentType = WingsPaymentType.bank; break
                case 12: wingPaymentType = WingsPaymentType.cash; break
                case 21: wingPaymentType = WingsPaymentType.gift; break
            }
  
            const pctTax = this.reportMonth.tax[pct]
            if (pctTax) {
                worksheet.getCell(row, 3).value = pct
                worksheet.getCell(row, 4).value = pctTax.excl
                worksheet.getCell(row, 5).value = pctTax.incl
                worksheet.getCell(row, 6).value = pctTax.tax
                worksheet.getCell(row, 9).value = wingPaymentType
                worksheet.getCell(row, 10).value = this.totals.get(wingPaymentType) || 0
                lastDataRow = row
                row++
            }
        }

        // SUM row
        worksheet.getCell(row, 4).value = { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }
        worksheet.getCell(row, 5).value = { formula: `SUM(E${firstDataRow}:E${lastDataRow})` }
        worksheet.getCell(row, 6).value = { formula: `SUM(F${firstDataRow}:F${lastDataRow})` }
        worksheet.getCell(row, 10).value = { formula: `SUM(J${firstDataRow}:J${lastDataRow})` }
        row++

        // Empty row
        row++

        // Mismatch row
        worksheet.getCell(row, 5).value = 'Mismatch'
        worksheet.getCell(row, 6).value = { formula: 'F9-E5' }
        row++

        row++
        const firstPaymentRow = row + 2

        // Totals row
        worksheet.getCell(row, 1).value = 'totals:'
        worksheet.getCell(row, 6).value = { formula: `SUM(F${firstPaymentRow}:F9999)` }
        worksheet.getCell(row, 7).value = { formula: `SUM(G${firstPaymentRow}:G9999)` }
        worksheet.getCell(row, 8).value = { formula: `SUM(H${firstPaymentRow}:H9999)` }
        worksheet.getCell(row, 9).value = { formula: `SUM(I${firstPaymentRow}:I9999)` }
        worksheet.getCell(row, 10).value = { formula: `SUM(J${firstPaymentRow}:J9999)` }
        worksheet.getCell(row, 11).value = { formula: `SUM(K${firstPaymentRow}:K9999)` }
        worksheet.getCell(row, 12).value = { formula: `SUM(L${firstPaymentRow}:L9999)` }
        row++

        // Payment header
        const paymentHeaders = ['amount', 'type', 'yearMonth', 'fee', 'date', 'wings', 'grouped', 'dd_bank', 'dd_cash', 'dd_gift', 'errors', 'noDecl', 'problem', 'info', 'pay-info', 'products', 'bankTx']
        paymentHeaders.forEach((h, i) => worksheet.getCell(row, i + 1).value = h)
        row++

        let lastTxNum: string = null
        for (const payment of this.payments) {
            const showTxInfo = lastTxNum !== payment.txNum
            if (showTxInfo) lastTxNum = payment.txNum
            const rowData = payment.toExcelRow(showTxInfo)
            rowData.forEach((val, i) => {
                const cell = worksheet.getCell(row, i + 1)
                if (typeof val === 'number' && val === 0) {
                    cell.value = ''  // Match toCsvNumber: empty for zero
                } else {
                    if (val instanceof ExcelUrl) {
                        cell.value = { text: val.text, hyperlink: val.url }
                        cell.font = { color: { argb: 'FF0000FF' }, underline: true }
                    } else {
                        cell.value = val
                    }
                }
            })
            row++
        }

        return workbook
    }

    toCsv(): string {
        let csv = ''
        csv += `${this.reportMonth.year};${this.reportMonth.month};%;excl;incl;tax;;;totals\n`
        let line = 1

        for (let pct of [6, 12, 21]) {

            let wingPaymentType = WingsPaymentType.bank

            switch (pct) {
                case 6:
                    wingPaymentType = WingsPaymentType.bank
                    break
                case 12:
                    wingPaymentType = WingsPaymentType.cash
                    break
                case 21:
                    wingPaymentType = WingsPaymentType.gift
                    break
            }

            let pctTax = this.reportMonth.tax[pct]

            if (pctTax) {
                csv += `;;${pct};${toCsvNumber(pctTax.excl)};${toCsvNumber(pctTax.incl)};${toCsvNumber(pctTax.tax)};;${wingPaymentType};${toCsvNumber(this.totals.get(wingPaymentType) || 0)}\n`
                line++
            }

        }
        csv += `;;;=SUM(D2:D${line});=SUM(E2:E${line});=SUM(F2:F${line});;;=SUM(I2:I${line})\n`
        line++

        csv += `\n`
        csv += `;;;;Mismatch;=F8-E5\n`
        line++


        line++
        csv += `totals:;;;;;=SUM(F${line + 2}:F9999);=SUM(G${line + 2}:G9999);=SUM(H${line + 2}:H9999);=SUM(I${line + 2}:I9999);=SUM(J${line + 2}:J9999);=SUM(K${line + 2}:K9999);=SUM(L${line + 2}:L9999);\n`


        csv += 'amount;type;yearMonth;fee;date;wings;grouped;dd_bank;dd_cash;dd_gift;errors;noDecl;problem;info;bankTx;\n'
        line++



        let lastTxNum = null

        for (let payment of this.payments) {

            let showTxInfo = false

            if (lastTxNum != payment.txNum) {
                lastTxNum = payment.txNum
                showTxInfo = true
            }

            csv += payment.toCsv(showTxInfo)
            line++
        }
        return csv
    }

}

export enum WingsPaymentType {
    bank = 'bank',
    cash = 'cash',
    gift = 'gift',
}

// Note: Avoid referencing PaymentType at module load to prevent circular init issues

export class WingsPaymentLine {

    type: WingsPaymentType

    amount: number = 0

    /** different lines make up a group: in Wings we only have group data: for checking the group totals will be used */
    groupTotalDeclared: number = 0

    dd_bank: number = 0   // declare direct
    dd_cash: number = 0   // declare cash
    dd_gift: number = 0   // declare gift
    fee: number = 0

    decl: boolean = false
    noDecl = 0

    declInMonth: number = 0

    pay: Payment
    tx: BankTransaction
    txNum: string

    info: string = ''

    products: string

    inMonth: boolean = false

    order: Order

    error: boolean = false
    errorMsg: string = ''

    /** if this payment is in the current month */
    setInMonth(inMonth: boolean) {
        this.inMonth = inMonth

        if (!inMonth) {
            this.dd_cash = 0
            this.dd_bank = 0
            this.dd_gift = 0
        }
    }

    setError(errorMsg: string) {
        this.error = true
        this.errorMsg = errorMsg
    }

    constructor(type: WingsPaymentType, currentYearMonth: YearMonth, pay: Payment, declareTotalsByOrder: Map<string, number>, tx?: BankTransaction) {
        this.type = type
        this.pay = pay

        if (tx) {
            this.tx = tx
            this.txNum = tx.num
        } else {
            this.txNum = '/'
        }

        this.decl = pay.decl
        this.noDecl = pay.noDecl
        this.fee = pay.fee
        this.order = pay.order

        if (ArrayHelper.NotEmpty(this.order?.sum)) {
            this.products = this.order.sum.map(s => s.d).join(', ')
        }

        this.amount = pay.amount

        let payDate = pay.dateTyped
        this.declInMonth = (payDate.getFullYear() - 2000) * 100 + payDate.getMonth() + 1

        let currentYearMonthNum = currentYearMonth.toNumber(true)
        this.decl = false

        let order = pay.order

        if (order.invoiced) {

            this.info = `Invoice=${order.invoiceNum}`
        } else if (order.gift) {

            this.info = `Gift=${order.giftCode}`
        } else if (pay.type == PaymentType.gift && pay.gift && pay.gift.decl) {

            this.info = `Gift payment already declared (invoiced or old gift)`

        } else if (currentYearMonthNum == this.declInMonth) {
            this.decl = true
            if ([PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer].includes(pay.type)) {
                this.dd_bank = pay.amount
            } else if (pay.type === PaymentType.cash) {
                this.dd_cash = pay.amount - pay.noDecl
            } else if (pay.type === PaymentType.gift) {
                this.dd_gift = pay.amount
            }
        } else {
            this.info = 'Declared in other month'
        }

        let totalDeclared = this.totalDeclared

        if (totalDeclared != 0) {

            if (declareTotalsByOrder.has(order.id)) {
                totalDeclared += declareTotalsByOrder.get(order.id)
            }

            declareTotalsByOrder.set(order.id, totalDeclared)
        }
    }

    get totalDeclared(): number {
        let wings = this.dd_bank + this.dd_cash + this.dd_gift
        return wings
    }

    toCsv(showTxInfo: boolean): string {

        let error = this.error ? 1 : 0

        let csv = `${toCsvNumber(this.amount)};${this.pay.type};${this.declInMonth};${toCsvNumber(this.fee)};${toCsvDate(this.pay.date)};${toCsvNumber(this.totalDeclared)};${toCsvNumber(this.groupTotalDeclared)};${toCsvNumber(this.dd_bank)};${toCsvNumber(this.dd_cash)};${toCsvNumber(this.dd_gift)};${toCsvNumber(error)};${toCsvNumber(this.noDecl)};${this.errorMsg};${this.info} ${this.order.for};${this.txNum}`

        if (showTxInfo && this.tx) {
            csv += `;${toCsvNumber(this.tx.amount)};${this.tx.type};${this.tx.details}`
        }

        csv += `\n`


        return csv
    }

    toExcelRow(showTxInfo: boolean): (string | number | ExcelUrl)[] {
        const error = this.error ? 1 : 0
        const row: (string | number | ExcelUrl)[] = [ 
            this.amount,
            new ExcelUrl(`https://pos.birdy.life/aqua/orders/manage/${this.pay.orderId}`, this.pay.type),
            this.declInMonth,
            this.fee,
            toCsvDate(this.pay.date),
            this.totalDeclared,
            this.groupTotalDeclared,
            this.dd_bank,
            this.dd_cash,
            this.dd_gift,
            error,
            this.noDecl,
            this.errorMsg,
            `${this.info} ${this.order.for}`,
            this.pay.info,
            this.products,
            this.txNum,
        ]
        if (showTxInfo && this.tx) {
            row.push(this.tx.amount, this.tx.type, this.tx.details)
        }
        return row
    }

}

export class WingsReporting {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }



    async createYearMonth(yearMonth: YearMonth, branchId: string): Promise<WingsMonthReport> {

        let report = new WingsMonthReport()

        console.error(`Start creating report`)

        let from = yearMonth.startDate()
        let to = yearMonth.endDate()

        //let to = dateFns.addDays(from, 5)


        report.reportMonth = await this.alteaDb.getReportMonth(branchId, yearMonth.y, yearMonth.m)


        let declareTotalsByOrder = new Map<string, number>()



        var paysInMonth = await this.alteaDb.getPaymentsBetween(branchId, from, to, null, false, ['order', 'bankTx', 'gift'])
        let allMonthPayments = paysInMonth.list

        let minTxNum = _.minBy(allMonthPayments, 'bankTx.numInt')?.bankTx?.numInt
        let maxTxNum = _.maxBy(allMonthPayments, 'bankTx.numInt')?.bankTx?.numInt


        let txs = await this.alteaDb.getBankTransactionNumberRange(branchId, minTxNum, maxTxNum, 'payments.order')


        /** First do all bank transactions, remove payments from payments array that are in the current month */

        for (let tx of txs) {

            let firstPaymentForTx: WingsPaymentLine = null

            for (let pay of tx?.payments) {

                let idx = _.findIndex(allMonthPayments, p => p.id == pay.id)

                let payWithLinks = pay

                if (idx >= 0)
                    payWithLinks = allMonthPayments[idx]


                let line = new WingsPaymentLine(WingsPaymentType.bank, yearMonth, payWithLinks, declareTotalsByOrder, tx)

                if (idx >= 0) {
                    _.remove(allMonthPayments, p => p.id == pay.id)
                    line.setInMonth(true)
                }


                report.addPayment(line)

                if (!firstPaymentForTx)
                    firstPaymentForTx = line


                firstPaymentForTx.groupTotalDeclared += line.totalDeclared
            }

        }

        
        /** Show all bank payments of this month not linked to bank transactions */

        this.doPayTypes(WingsPaymentType.bank, allMonthPayments, [PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer], report, yearMonth, declareTotalsByOrder)

        /*
        let bankTypes = [PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer]
        let notLinkedBankPayments = _.remove(allMonthPayments, p => bankTypes.indexOf(p.type) >= 0)

        for (let pay of notLinkedBankPayments) {
            let line = new WingsPaymentLine(yearMonth, pay, declareTotalsByOrder)
            line.setInMonth(true)
            report.addPayment(line)
        }*/

        /** Show all cash payments of this month, remove from list */

        this.doPayTypes(WingsPaymentType.cash, allMonthPayments, [PaymentType.cash], report, yearMonth, declareTotalsByOrder)
        this.doPayTypes(WingsPaymentType.gift, allMonthPayments, [PaymentType.gift], report, yearMonth, declareTotalsByOrder)
/* 
        let otherPayTypes = [PaymentType.cash, PaymentType.gift]
        let cashPayments = _.remove(allMonthPayments, p => p => otherPayTypes.indexOf(p.type) >= 0)

        for (let pay of cashPayments) {
            let line = new WingsPaymentLine(yearMonth, pay, declareTotalsByOrder)
            line.setInMonth(true)
            report.addPayment(line)
        } */

        /** Now we check if total declared is equal to total amount */

        let orderIds = Array.from(declareTotalsByOrder.keys())

        for (let orderId of orderIds) {

            let totalDeclared = declareTotalsByOrder.get(orderId)

            let lines = report.getLinesForOrder(orderId)

            let order = lines[0].order

            let official = order.tax.totalYearMonthIncl(yearMonth)

            if (official != totalDeclared) {
                console.error(`Error: Order ${orderId} declared ${totalDeclared} but official ${official}`)

                for (let line of lines) {
                    line.setError(`Error: Order ${orderId} declared ${totalDeclared} but official ${official}`)
                }
            }
        }

        return report

    }

    doPayTypes(type: WingsPaymentType, payments: Payment[], bankTypes: PaymentType[], report: WingsMonthReport, yearMonth: YearMonth, declareTotalsByOrder: Map<string, number>) {
        let specificPayments = _.remove(payments, p => bankTypes.indexOf(p.type) >= 0)

        if (ArrayHelper.IsEmpty(specificPayments))
            return

        specificPayments = _.sortBy(specificPayments, 'date')

        let groupDate: Date
        let groupLine: WingsPaymentLine = null

        for (let pay of specificPayments) {
            let line = new WingsPaymentLine(type, yearMonth, pay, declareTotalsByOrder)
            line.setInMonth(true)
            report.addPayment(line)

            let payDate = pay.dateTyped

            if (!groupDate || !groupLine || !dateFns.isSameDay(payDate, groupDate)) {
                groupLine = line
                groupDate = payDate
            }
            
            groupLine.groupTotalDeclared += line.totalDeclared
        }

    }

    getUniqueTransactions(payments: Payment[]): BankTransaction[] {
        let txs = Array.from(
            new Map(
                payments
                    .filter(p => p.bankTx) // drop null/undefined
                    .map(p => [p.bankTx!.id, p.bankTx!]) // map to [id, transaction]
            ).values()
        );

        txs = _.sortBy(txs, 'numInt')

        return txs
    }

}