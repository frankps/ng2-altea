import { BankTransaction, BankTxInfo, BankTxType, Payment, PaymentType } from "ts-altea-model"
import { CsvImport, ImportColumn, ImportDefinition } from "./csv-import"
import * as dateFns from 'date-fns'
import { ApiListResult, ArrayHelper, DateHelper, DbObjectMulti, ObjectHelper, YearMonth } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { instanceToPlain, plainToInstance } from "class-transformer"
import { fragment, create } from 'xmlbuilder2';
import * as _ from "lodash";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces"
import { WingsExportBase, WingsExportRequest, WingsExportResponse } from "./wings-export"


// Enum
export enum CashBookRecordType {
    PurchaseInvoice = "PurchaseInvoice",
    DayTotalCashPayments = "DayTotalCashPayments",
    CashToBank = "CashToBank",
}

// CashDate class
export class CashDate {
    year: number;
    month: number;
    day: number;

    constructor(year: number, month: number, day: number) {
        this.year = year;
        this.month = month;
        this.day = day;
    }

    toDate(): Date {
        return new Date(this.year, this.month - 1, this.day); // JS months are 0-based
    }
}

// CashBookRecord class
export class CashBookRecord {
    type: CashBookRecordType;
    category: string;
    info: string;
    amount: number;
    cashDate: CashDate;

    constructor(
        type: CashBookRecordType,
        category: string,
        info: string,
        amount: number,
        cashDate: CashDate
    ) {
        this.type = type;
        this.category = category;
        this.info = info;
        this.amount = amount;
        this.cashDate = cashDate;
    }

    get date(): Date {
        return this.cashDate.toDate();
    }
}

// CashBookWingsInterfaceResponse class
export class CashBookWingsInterfaceResponse {
    message: string;
    xmlResult: string;
    dossierId: string;

    constructor(message: string, xmlResult: string) {
        this.message = message;
        this.xmlResult = xmlResult;
    }
}


export class CashToWingsExport extends WingsExportBase {

    constructor(db: IDb | AlteaDb) {

        super(db)
    }

    async export(request: WingsExportRequest): Promise<WingsExportResponse> {


        console.log('CashToWingsExport started', request)

        // let yearMonth = request.getYearMonth()

        let records = await this.createReportRecords(request)

        let response = this.createXml(records, request)

        return response
    }




    async createReportRecords(request: WingsExportRequest): Promise<CashBookRecord[]> {

        var cashPayments = await this.alteaDb.getPaymentsInYearMonth(request.branchId, request.yearMonth, [PaymentType.cash], ['order'])

        let cashGroups = this.groupPayments(cashPayments.list)

        let cashBookRecords = this.groupsToRecords(cashGroups)

        return cashBookRecords

    }

    createXml(records: CashBookRecord[], request: WingsExportRequest) : WingsExportResponse {


        let totalAmount = _.sumBy(records, 'amount')
        let balance = totalAmount
        var xmlBookings = this.createXmlHeader("KAS", request.defaultRunningNumber(), request.opDate(), "570000", totalAmount)
        var bookingTag = xmlBookings.first()

        let count = 0

        let messages = []

        for (let record of records) {
            let accountType = ''
            let accountId = ''

            switch (record.type) {
                case CashBookRecordType.DayTotalCashPayments:
                    if (record.category == "Gift" || record.category == "CreditUpload") {
                        accountType = "1";
                        accountId = this.overTeDragenOpbrengstenId;
                    }
                    else {
                        accountType = "2";
                        accountId = this.wingsDagontvangstenCustomerId;
                    }
                    break;
                case CashBookRecordType.CashToBank:
                    accountType = "1";
                    accountId = "580000";
                    break;

            }

            let lineAmountDC = -record.amount;
            balance += lineAmountDC;

            let comment = `${dateFns.format(record.date, 'dd/MM')} ${record.info}`
            var xmlDetail = this.createXmlDetail(accountType, accountId, lineAmountDC, comment)
            bookingTag.import(xmlDetail)
            count++
        }

        messages.push(`Nr of detail records: ${count}`)

        if (balance == 0)
            messages.push("OK, balance is 0.")
        else
            messages.push(`niet OK: balance is ${balance} (maar zou 0 moeten zijn!)`)

        let xmlDoc = this.buildWingsAccounting(request.rootPath, request.dossierId, xmlBookings)

        const xmlString = xmlDoc.end({
            prettyPrint: true,
            headless: false,
        });

        const response = new WingsExportResponse()
        response.message = messages.join("\n")
        response.xmlString = xmlString
        return response
    }

    groupPayments(payments: Payment[]): _.Dictionary<Payment[]> {

        const grouped = _.groupBy(payments, (p) => {

            let payDate = p.dateTyped

            return [
                payDate.getFullYear(),
                payDate.getMonth() + 1,
                payDate.getDate(),
                p.order.invoiced,
                p.order.invoiceNum,
                p.order.gift,
                p.order.giftCode
            ].join("|");
        });

        return grouped

    }

    groupsToRecords(cashGroups: _.Dictionary<Payment[]>): CashBookRecord[] {

        const result = Object.entries(cashGroups).map(([key, group]) => {

            let firstPay = group[0]

            let payDate = firstPay.dateTyped
            let year = payDate.getFullYear()
            let month = payDate.getMonth() + 1
            let day = payDate.getDate()

            let cashDate = new CashDate(year, month, day)

            let amount = _.sumBy(group, (p) => p.amount)

            let category = firstPay.order.invoiced ? "Fact" : (firstPay.order.gift ? "Gift" : "Algemeen")
            let info = firstPay.order.invoiced ? `Fact=${firstPay.order.invoiceNum}` : (firstPay.order.gift ? `Gift=${firstPay.order.giftCode}` : "Algemeen")

            let record = new CashBookRecord(CashBookRecordType.DayTotalCashPayments, category, info, amount, cashDate)

            return record
        }

        )

        return result

    }


}