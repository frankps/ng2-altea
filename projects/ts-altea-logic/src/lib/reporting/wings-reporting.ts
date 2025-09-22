import { DateHelper, YearMonth } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { PaymentType, BankTransaction, Payment, ReportMonth } from "ts-altea-model"
import * as dateFns from 'date-fns'
import * as _ from "lodash"


const intl = new Intl.NumberFormat("nl-BE", {
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

// Formats numbers for CSV with , as decimal and no thousands separator
function toCsvNumber(value: number, decimals = 2): string {
    return intl.format(value);
}

function toCsvDate(value: number): string {
    let date = DateHelper.parse(value)

    if (date)
        return dateFns.format(date, 'dd/MM HH:mm')
    else
        return ''
}


export class WingsReport {

    reportMonth: ReportMonth

    payments: WingsPaymentLine[] = []

    constructor() {
        this.payments = []
    }

    addPayment(payment: WingsPaymentLine) {
        this.payments.push(payment)
    }

    toCsv(): string {
        let csv = ''
        csv += `${this.reportMonth.year};${this.reportMonth.month};%;excl;incl;tax\n`
        let line = 1

        for (let pct of [6, 12, 21]) {

            let pctTax = this.reportMonth.tax[pct]

            if (pctTax) {
                csv += `;;${pct};${toCsvNumber(pctTax.excl)};${toCsvNumber(pctTax.incl)};${toCsvNumber(pctTax.tax)}\n`
                line++
            }

        }
        csv += `;;;=SUM(D2:B${line});=SUM(E2:E${line});=SUM(F2:F${line});;\n`
        line++

        csv += `\n`
        line++


        line++
        csv += `totals:;;;;;=SUM(F${line + 2}:F9999);=SUM(G${line + 2}:G9999);;\n`


        csv += 'amount;type;yearMonth;fee;date;dd_bank;dd_cash;noDecl;bankTx;\n'
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

// Note: Avoid referencing PaymentType at module load to prevent circular init issues

export class WingsPaymentLine {

    amount: number = 0

    dd_bank: number = 0   // declare direct
    dd_cash: number = 0   // declare cash
    fee: number = 0

    decl: boolean = false
    noDecl = 0

    declInMonth: number = 0

    pay: Payment
    tx: BankTransaction
    txNum: string

    info: string = ''

    constructor(currentYearMonth: YearMonth, pay: Payment, tx?: BankTransaction) {
        this.pay = pay

        if (tx) {
            this.tx = tx
            this.txNum = tx.num
        }

        this.decl = pay.decl
        this.noDecl = pay.noDecl
        this.fee = pay.fee

        this.amount = pay.amount

        let payDate = pay.dateTyped
        this.declInMonth = (payDate.getFullYear() - 2000) * 100 + payDate.getMonth() + 1

        let currentYearMonthNum = currentYearMonth.toNumber(true)
        this.decl = false

        if (pay.order.invoiced) {

            this.info = `Invoice=${pay.order.invoiceNum}`
        } else if (pay.order.gift) {

            this.info = `Gift=${pay.order.giftCode}`
        } else if (currentYearMonthNum == this.declInMonth) {
            this.decl = true
            if ([PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer].includes(pay.type)) {
                this.dd_bank = pay.amount
            } else if (pay.type === PaymentType.cash) {
                this.dd_cash = pay.amount
            }
        } else {
            this.info = 'Declared in other month'
        }



    }

    toCsv(showTxInfo: boolean): string {
        let csv = `${toCsvNumber(this.amount)};${this.pay.type};${this.declInMonth};${toCsvNumber(this.fee)};${toCsvDate(this.pay.date)};${toCsvNumber(this.dd_bank)};${toCsvNumber(this.dd_cash)};${this.noDecl};${this.info};${this.tx.num}`

        if (showTxInfo && this.tx) {
            csv += `;${toCsvNumber(this.tx.amount)};${this.tx.type};${this.tx.details}`
        }

        csv += `\n`


        return csv
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


    async create(yearMonth: YearMonth, branchId: string): Promise<WingsReport> {

        let report = new WingsReport()

        console.error(`Start creating report`)

        let from = yearMonth.startDate()
        let to = yearMonth.endDate()

        //let to = dateFns.addDays(from, 5)


        report.reportMonth = await this.alteaDb.getReportMonth(branchId, yearMonth.y, yearMonth.m)


        let bankTypes = [PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer]

        var paysInMonth = await this.alteaDb.getPaymentsBetween(branchId, from, to, bankTypes, false, ['order', 'bankTx'])
        let payments = paysInMonth.list

        let minTxNum = _.minBy(payments, 'bankTx.numInt')?.bankTx?.numInt
        let maxTxNum = _.maxBy(payments, 'bankTx.numInt')?.bankTx?.numInt


        let txs = await this.alteaDb.getBankTransactionNumberRange(branchId, minTxNum, maxTxNum, 'payments.order')
        //let txs = this.getUniqueTransactions(payments)

        /*
        for (let tx of txs) {
            let pays = _.filter(payments, p => p.bankTxId === tx.id)
            let totalAmount = _.sumBy(pays, 'amount')
            console.log(tx.numInt, totalAmount)
        }*/


        /*
        for (let pay of payments) {

            let line = new WingsPaymentLine(pay)

            report.addPayment(line)

        }
        */

        for (let tx of txs) {

            for (let pay of tx?.payments) {

                let line = new WingsPaymentLine(yearMonth, pay, tx)

                report.addPayment(line)
            }

        }

        return report

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