import { DateHelper, YearMonth } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { PaymentType, BankTransaction, Payment, ReportMonth, Order } from "ts-altea-model"
import * as dateFns from 'date-fns'
import * as _ from "lodash"


const intl = new Intl.NumberFormat("en-US", {   //"nl-BE"
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

    getLinesForOrder(orderId: string): WingsPaymentLine[] {
        return this.payments.filter(p => p.order.id == orderId)
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
        csv += `;;;;Mismatch;=F8-E5\n`
        line++


        line++
        csv += `totals:;;;;;=SUM(F${line + 2}:F9999);=SUM(G${line + 2}:G9999);=SUM(H${line + 2}:H9999);=SUM(I${line + 2}:I9999);=SUM(J${line + 2}:J9999);=SUM(K${line + 2}:K9999);\n`


        csv += 'amount;type;yearMonth;fee;date;wings;dd_bank;dd_cash;dd_gift;errors;noDecl;problem;info;bankTx;\n'
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
    dd_gift: number = 0   // declare gift
    fee: number = 0

    decl: boolean = false
    noDecl = 0

    declInMonth: number = 0

    pay: Payment
    tx: BankTransaction
    txNum: string

    info: string = ''

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

    constructor(currentYearMonth: YearMonth, pay: Payment, declareTotalsByOrder: Map<string, number>, tx?: BankTransaction) {
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

        let csv = `${toCsvNumber(this.amount)};${this.pay.type};${this.declInMonth};${toCsvNumber(this.fee)};${toCsvDate(this.pay.date)};${toCsvNumber(this.totalDeclared)};${toCsvNumber(this.dd_bank)};${toCsvNumber(this.dd_cash)};${toCsvNumber(this.dd_gift)};${toCsvNumber(error)};${toCsvNumber(this.noDecl)};${this.errorMsg};${this.info} ${this.order.for};${this.txNum}`

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


        let declareTotalsByOrder = new Map<string, number>()



        var paysInMonth = await this.alteaDb.getPaymentsBetween(branchId, from, to, null, false, ['order', 'bankTx', 'gift'])
        let allMonthPayments = paysInMonth.list

        let minTxNum = _.minBy(allMonthPayments, 'bankTx.numInt')?.bankTx?.numInt
        let maxTxNum = _.maxBy(allMonthPayments, 'bankTx.numInt')?.bankTx?.numInt


        let txs = await this.alteaDb.getBankTransactionNumberRange(branchId, minTxNum, maxTxNum, 'payments.order')


        /** First do all bank transactions, remove payments from payments array that are in the current month */

        for (let tx of txs) {

            for (let pay of tx?.payments) {

                let idx = _.findIndex(allMonthPayments, p => p.id == pay.id)

                let payWithLinks = pay

                if (idx >= 0)
                    payWithLinks = allMonthPayments[idx]


                let line = new WingsPaymentLine(yearMonth, payWithLinks, declareTotalsByOrder, tx)

                if (idx >= 0) {
                    _.remove(allMonthPayments, p => p.id == pay.id)
                    line.setInMonth(true)
                }


                report.addPayment(line)
            }

        }

        /** Show all bank payments of this month not linked to bank transactions */

        let bankTypes = [PaymentType.credit, PaymentType.debit, PaymentType.stripe, PaymentType.transfer]
        let notLinkedBankPayments = _.remove(allMonthPayments, p => bankTypes.indexOf(p.type) >= 0)

        for (let pay of notLinkedBankPayments) {
            let line = new WingsPaymentLine(yearMonth, pay, declareTotalsByOrder)
            line.setInMonth(true)
            report.addPayment(line)
        }

        /** Show all cash payments of this month, remove from list */


        // other payments

        let otherPayTypes = [PaymentType.cash, PaymentType.gift]
        let cashPayments = _.remove(allMonthPayments, p => p => otherPayTypes.indexOf(p.type) >= 0)

        for (let pay of cashPayments) {
            let line = new WingsPaymentLine(yearMonth, pay, declareTotalsByOrder)
            line.setInMonth(true)
            report.addPayment(line)
        }

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