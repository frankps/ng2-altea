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

        let response = await this.createXml(giftPayments, request)

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


    async removeInvoicedPayments(giftPayments: Payments, messages: string[]): Promise<Payments> {
        
        let orderIds = giftPayments.getGiftOrderIds()
        let orders = await this.alteaDb.getOrdersByIds(orderIds)

        let result = new Payments()

        for (let giftPayment of giftPayments.list) {

            let gift = giftPayment.gift

            let orderIdOfGift = giftPayment.gift.orderId
            let orderOfGift = orders.find(o => o.id == orderIdOfGift)

            let dateStr = dateFns.format(giftPayment.dateTyped, 'dd/MM HH:mm')

            let giftWasInvoiced = false
            if (orderOfGift) {
                if (orderOfGift.invoiced)
                    giftWasInvoiced = true
            } else {    // we don't have the original order anymore (legacy) => we trust the flag gift.invoice
                if (gift.invoice)
                    giftWasInvoiced = true
            }

            
            if (giftWasInvoiced) {
                let giftCreationDate = dateFns.format(gift.cre, 'dd/MM/yy HH:mm')

                messages.push(`Skipping gift payment ${gift.code} on ${dateStr}: order is invoiced ${orderOfGift?.invoiceNum ?? '<old system>'} (gift created on ${giftCreationDate})`)
                continue
            } else {
                result.add(giftPayment)
            }
        }

        return result

    }

    async createXml(giftPayments: Payments, request: WingsExportRequest): Promise<WingsExportResponse> {

        let messages = []
        let giftPaymentsNotInvoiced = await this.removeInvoicedPayments(giftPayments, messages)



        let totalAmount = giftPaymentsNotInvoiced.totalAmount()
        let balance = totalAmount
        var xmlBookings = this.createXmlHeader("D01", null, request.opDate(), this.overTeDragenOpbrengstenId, totalAmount)
        var bookingTag = xmlBookings.first()

        let count = 0


        for (let giftPayment of giftPaymentsNotInvoiced.list) {


            let gift = giftPayment.gift

            let dateStr = dateFns.format(giftPayment.dateTyped, 'dd/MM HH:mm')

            let comment = `${dateStr} cadeaubon ${gift.code ?? 'null'}`  

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
            messages.push(`Not OK: balance is ${balance} (maar zou 0 moeten zijn!)`)

        let xmlDoc = this.buildWingsAccounting(request.rootPath, request.dossierId, xmlBookings)

        const xmlString = xmlDoc.end({
            prettyPrint: true,
            headless: false,
        });

        const response = new WingsExportResponse()
        response.messages = messages
        response.xmlString = xmlString
        return response

    }


}