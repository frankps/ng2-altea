import { DateHelper, NumberHelper, YearMonth } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { PaymentType, BankTransaction, Payment, ReportMonth, Order } from "ts-altea-model"
import * as dateFns from 'date-fns'
import * as _ from "lodash"

export class WingsYearReportLine {
    yearMonth: YearMonth

    cash: number = 0
    noDecl: number = 0
   
    get cashDecl(): number {
        return this.cash - this.noDecl
    }

    constructor(yearMonth: YearMonth) {
        this.yearMonth = yearMonth
    }
    
}

export class WingsYearReport {

    lines: WingsYearReportLine[] = []

    constructor() {
        
    }

    newLine(yearMonth: YearMonth): WingsYearReportLine {
        let line = new WingsYearReportLine(yearMonth)
        this.lines.push(line)
        return line
    }

    total(): WingsYearReportLine {
        let line = new WingsYearReportLine(new YearMonth(0, 0))
        line.cash = _.sumBy(this.lines, 'cash')
        line.noDecl = _.sumBy(this.lines, 'noDecl')
       
        return line
    }
    toCsv(): string {

        let csv = ''

        let lineNum = 1
        csv += `year;month;cash;noDecl;cashDecl\n`
        


        for (let line of this.lines) {
            lineNum++
            csv += `${line.yearMonth.y};${line.yearMonth.m};${NumberHelper.toCsvNumber(line.cash)};${NumberHelper.toCsvNumber(line.noDecl)};${NumberHelper.toCsvNumber(line.cashDecl)}\n`
        }

        let total = this.total()
        csv += `;;=SUM(C2:C${lineNum});=SUM(D2:D${lineNum});=SUM(E2:E${lineNum})\n`
        lineNum++
      

        return csv
    }
}

export class WingsYearReporting {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async createYear(startYearMonth: YearMonth, branchId: string): Promise<WingsYearReport> {
        let yearMonth = startYearMonth

        let toYearMonth = startYearMonth.addMonths(11)
        let toYearMonthNum = toYearMonth.toNumber()

        let i = 0

        let yearReport = new WingsYearReport()

        while (yearMonth.toNumber() <= toYearMonthNum) {
            let line = yearReport.newLine(yearMonth)

            await this.calculateCash(line, branchId)

            yearMonth = yearMonth.addMonths(1)
            i++

          /*   if (i == 2)
                break */
        }


        return yearReport
    }


    async calculateCash(line: WingsYearReportLine, branchId: string) {

        let from = line.yearMonth.startDate()
        let to = line.yearMonth.endDate()

        let cashPayments = await this.alteaDb.getPaymentsBetween(branchId, from, to, [PaymentType.cash], false, ['order'])

        line.cash = _.sumBy(cashPayments.list, 'amount')
        line.noDecl = _.sumBy(cashPayments.list, 'noDecl')
        

        let specialCash = _.filter(cashPayments.list, p => (p.order.invoiced || p.order.gift) && p.noDecl > 0)

        if (specialCash?.length > 0) {
            console.error('specialCash', specialCash)
        }
    }



}