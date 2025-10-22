import { BankTransaction, BankTxInfo, BankTxType, Payment, Payments, PaymentType } from "ts-altea-model"
import { CsvImport, ImportColumn, ImportDefinition } from "./csv-import"
import * as dateFns from 'date-fns'
import { ApiListResult, ArrayHelper, DateHelper, DbObjectMulti, ObjectHelper, QueryCondition, QueryOperator, YearMonth } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { instanceToPlain, plainToInstance } from "class-transformer"
import { fragment, create } from 'xmlbuilder2';
import * as _ from "lodash";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces"
import { WingsExportBase, WingsExportRequest, WingsExportResponse } from "./wings-export"


export class GiftToWingsExport extends WingsExportBase {

    constructor(db: IDb | AlteaDb) {

        super(db)
    }

    async export(request: WingsExportRequest): Promise<WingsExportResponse> {


        console.log('CashToWingsExport started', request)

        // let yearMonth = request.getYearMonth()

        let giftPayments = await this.getGiftPayments(request)

        let response = this.createXml(giftPayments, request)

        return response
    }

    async getGiftPayments(request: WingsExportRequest): Promise<Payments> {

        let filters: QueryCondition[] = []
        filters.push(QueryCondition.filter('order.gift', QueryOperator.equals, false))
        filters.push(QueryCondition.filter('order.invoiced', QueryOperator.equals, false))

        let newRules = new Date(2015, 0, 1)
        filters.push(QueryCondition.filter('gift.cre', QueryOperator.greaterThan, newRules))

        let giftPayments = await this.alteaDb.getPaymentsInYearMonth(request.branchId, request.yearMonth, [PaymentType.gift], ['order', 'gift'], filters)  // , ['order', 'gift.order']

        return giftPayments
    }

    createXml(giftPayments: Payments, request: WingsExportRequest): WingsExportResponse {


        let totalAmount = giftPayments.totalAmount()
        let balance = totalAmount
        var xmlBookings = this.createXmlHeader("D01", null, request.opDate(), this.overTeDragenOpbrengstenId, totalAmount)
        var bookingTag = xmlBookings.first()

        let count = 0
        let messages = []

        for (let giftPayment of giftPayments.list) {

            let order = giftPayment.order
            let gift = giftPayment.gift

            let dateStr = dateFns.format(giftPayment.dateTyped, 'dd/MM')

            let comment = `${dateStr} cadeaubon ${gift.code ?? 'null'}`  // $"{pay.Date.ToString("dd/MM")} cadeaubon '{pay.Gift.GiftCode}'"

            // "2", wingsDagontvangstenCustomerId
            let lineAmountDC = -giftPayment.amount;
            balance += lineAmountDC;

            let xmlDetail = this.createXmlDetail("2", this.wingsDagontvangstenCustomerId, lineAmountDC, comment)

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


}