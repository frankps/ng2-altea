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

    constructor(message: string, xmlResult: string) {
        this.message = message;
        this.xmlResult = xmlResult;
    }
}


export class CashToWingsExportRequest {

    yearMonth: number = -1  // yyyyMM

    branchId: string

    getYearMonth(): YearMonth {
        return YearMonth.parse(this.yearMonth)
    }
}

export class CashToWingsExportResponse {

    message: string
    xmlString: string

}

export class CashToWingsExport {

    alteaDb: AlteaDb

    wingsDagontvangstenCustomerId = "00000022";
    defaultWingsSupplierId = "00000534";
    overTeDragenOpbrengstenId = "493000";
    aquasenseOrganisationId = "66E77BDB-A5F5-4D3D-99E0-4391BDED4C6C"

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async export(request: CashToWingsExportRequest): Promise<CashToWingsExportResponse> {


        console.log('CashToWingsExport started', request)

        let yearMonth = request.getYearMonth()





        return new CashToWingsExportResponse()
    }


    async createReportRecords(request: CashToWingsExportRequest) : Promise<CashBookRecord[]> {

        let yearMonth = request.getYearMonth()

        var cashPayments = await this.alteaDb.getPaymentsInYearMonth(request.branchId, yearMonth, [PaymentType.cash])

        let cashGroups = this.groupPayments(cashPayments.list)

        let cashBookRecords = this.groupsToRecords(cashGroups)

        return cashBookRecords

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

    createXmlHeader(dagBoek: string, runningNumber: string, opDate: Date, accountID: string, totalAmount: number): XMLBuilder {
        const header = fragment()
            .ele('Booking')
            .ele('Header')
            .ele('Action').txt('1').up()
            .ele('BookCode').txt(dagBoek).up()
            .ele('RunningNumber').txt(runningNumber).up()
            .ele('OpDate').txt(opDate.toISOString().slice(0, 10).replace(/-/g, '')).up()
            .ele('HdrCurrencyID').txt('EUR').up()
            .up()
            .ele('Detail')
            .ele('AccountType').txt('1').up()
            .ele('AccountID').txt(accountID).up()
            .ele('LineAmountDC').txt(totalAmount.toFixed(4)).up()
            .ele('LineAmountHC').txt(totalAmount.toFixed(4)).up()
            .up()
            .up();

        return header //.end({ prettyPrint: true });
    }

    /** Base overload: returns a <Detail> node */
    createDetail(
        accountType: string,
        accountId: string,
        lineAmountDC: number,
        comment: string
    ): XMLBuilder {
        // Build as an independent fragment so it can be imported into any parent
        const f = fragment();
        const detail = f
            .ele('Detail')
            .ele('AccountType').txt(accountType).up()
            .ele('AccountID').txt(accountId).up()
            .ele('LineAmountDC').txt(lineAmountDC.toFixed(4)).up()
            .ele('LineAmountHC').txt(lineAmountDC.toFixed(4)).up()
            .ele('Comment').txt(comment).up()
            .up();
        return detail;
    }
}