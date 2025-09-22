import { BankTransaction, BankTxInfo, BankTxType } from "ts-altea-model"
import { CsvImport, ImportColumn, ImportDefinition } from "./csv-import"
import * as dateFns from 'date-fns'
import { ApiListResult, ArrayHelper, DateHelper, DbObjectMulti, ObjectHelper } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { instanceToPlain, plainToInstance } from "class-transformer"
import { fragment, create } from 'xmlbuilder2';
import * as _ from "lodash";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces"


/*

https://www.npmjs.com/package/xmlbuilder2
*/

export class BankToWingsExportRequest {

    yearMonth: number = -1  // yyyyMM

    accountId: string = 'BE12001328191492'
    from: number = 202401050
    to: number = 202401075
    /*     opDate: Date
        runningNumber: string */
    dagBoek: string = 'BANK'
    runningNumber: string = null
    dossierId: string = '0001'
    rekening: string = '550000'
    defaultWingsSupplierId: string = '00000534'
    defaultWingsCustomerId: string = '00000185'


    rootPath: string = 'C:\\Program Files\\Wings'


    // , string dossierId, string dagBoek, string rekening, string defaultWingsSupplierId, string defaultWingsCustomerId
}

export class BankToWingsExportResponse {

    message: string
    xmlString: string

}

export class BankToWingsExport {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async export(request: BankToWingsExportRequest): Promise<BankToWingsExportResponse> {


        console.log('BankToWingsExport started', request)

        var txs = await this.alteaDb.getBankTransactionNumberRange(request.accountId, request.from, request.to, 'payments.order')


        let totalAmount = _.sumBy(txs, 'amount')


        // DateHelper.yyyyMMdd(new Date())

        const yearMonth = `${request.yearMonth}`

        const runningNumber = ("00" + yearMonth.slice(-2)).slice(-3)
        
        var xmlBookings = this.createXmlHeader(request.dagBoek, runningNumber, new Date(), request.accountId, totalAmount)

        var bookingTag = xmlBookings.first()

        const wingsDagontvangstenCustomerId = "00000022";

        var balance = totalAmount;
        var txNum = request.from;
        for (var tx of txs) {
            var lineAmountDC = 0
            var extraCost = null

            var accountType = ""  // supplier account
            var accountId = ""
            var extraInfo = ""

            var txAmount = tx.amount
            var invoicedAmount = 0
            var giftAmount = 0

            var nrOfInvoicesForTx = 0

            var txLinkedToOrders = tx.hasPayments()

            if (txLinkedToOrders) {

                accountType = "2" // customer account: Daginkomsten, etc ...
                accountId = wingsDagontvangstenCustomerId

                if (tx.hasInvoice()) {

                    var invoicedPayments = tx.invoicedPayments()

                    for (var invoicedPayment of invoicedPayments) {

                        invoicedAmount += invoicedPayment.amount
                        txAmount -= invoicedPayment.amount
                        lineAmountDC = -invoicedPayment.amount
                        balance += lineAmountDC


                        var giftInfo = '';
                        if (invoicedPayment.order.gift)  // || (payment.Order.Gifts != null && payment.Order.Gifts.Count() > 0)
                            giftInfo = " en cadeau:" + (invoicedPayment.order.giftCode != null ? invoicedPayment.order.giftCode : "null");

                        var invoiceDetails = `factuur: ${invoicedPayment.order.invoiceNum}${giftInfo}`

                        var xmlDetail = this.createDetailWithDates(accountType, request.defaultWingsCustomerId, lineAmountDC,
                            tx.num, tx.execDateObject(), invoiceDetails, tx.refDateObject())

                        bookingTag.import(xmlDetail)

                        nrOfInvoicesForTx++
                    }

                }

                if (tx.hasGift()) {

                    var paymentsForGift = tx.paymentsForGiftNotInvoiced()

                    for (var paymentForGift of paymentsForGift) {

                        giftAmount += paymentForGift.amount
                        txAmount -= paymentForGift.amount

                        lineAmountDC = -paymentForGift.amount;
                        balance += lineAmountDC;

                        var giftDetails = "";

                        if (paymentForGift.order.gift)
                            giftDetails = `cadeau: ${paymentForGift.order.giftCode ?? 'null'}`
                        else
                            giftDetails = "credit upload";  // impossible in new system!

                        var xmlDetail = this.createDetailWithDates(accountType, request.defaultWingsCustomerId, lineAmountDC,
                            tx.num, tx.execDateObject(), giftDetails, tx.refDateObject())

                        bookingTag.import(xmlDetail)

                        nrOfInvoicesForTx++
                    }

                }

                if (tx.type) {
                    var txType = tx.type.toLowerCase();

                    /* een kredietkaart betaling wordt gesplitst in 2 lijnen:
                     *     bedrag excl kost
                     *     kost v/h gebruik v/d kredietkaart
                     */
                    if ((txType == "kredietkaart" || txType.indexOf("credit") >= 0 || txType == "stripe")
                        && tx.orig
                        && tx.cost) {
                        txAmount = tx.orig - invoicedAmount - giftAmount;

                        lineAmountDC = tx.cost;
                        balance += lineAmountDC;

                        switch (txType) {
                            case "stripe":
                                // create record for supplier Stripe

                                extraCost = this.createDetailWithDates("3", "00000672", lineAmountDC,
                                    tx.num, tx.execDateObject(), "kost Stripe", tx.refDateObject())

                                // extraCost = CreateDetail("3", "00000672", lineAmountDC, tx.TransactionNum, tx.ExecutionDate, "kost Stripe", tx.RefDate);

                                break;

                            default:
                                extraCost = this.createDetailWithDates("1", "656100", lineAmountDC,
                                    tx.num, tx.execDateObject(), "kost creditkaart", tx.refDateObject())

                                //extraCost = CreateDetail("1", "656100", lineAmountDC, tx.TransactionNum, tx.ExecutionDate, "kosten kaart", tx.RefDate);
                                break;
                        }

                    }
                }



            }


            if (!txLinkedToOrders) {

                accountType = "3";  // supplier account
                accountId = request.defaultWingsSupplierId;


            }

            lineAmountDC = -txAmount;
            balance += lineAmountDC;


            //string comment = string.Format("{0} {2} {1:dd/MM/yy}", tx.TransactionNum, tx.ExecutionDate, extraInfo);
            if (lineAmountDC != 0) {
                if (tx.type)
                    extraInfo += `tx type: ${tx.type}`;

                var xmlDetail = this.createDetailWithDates(accountType, accountId, lineAmountDC,
                    tx.num, tx.refDateObject() ?? tx.execDateObject(), extraInfo)

                bookingTag.import(xmlDetail)


            }


            if (extraCost != null)
                bookingTag.import(extraCost)

            //    booking.Add(extraCost);

            txNum++;


        }

        var xmlDoc = this.buildWingsAccounting(request.rootPath, request.dossierId, xmlBookings)


        const xmlString = xmlDoc.end({
            prettyPrint: true,
            headless: false,
        });

        const response = new BankToWingsExportResponse()
        response.message = "OK"
        response.xmlString = xmlString
        return response
    }


    createXmlHeader(dagBoek: string, runningNumber: string, opDate: Date, rekening: string, totalAmount: number): XMLBuilder {
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
            .ele('AccountID').txt('550000').up()
            .ele('LineAmountDC').txt(totalAmount.toFixed(4)).up()
            .ele('LineAmountHC').txt(totalAmount.toFixed(4)).up()
            .up()
            .up();

        return header //.end({ prettyPrint: true });
    }



    /** dd/MM or dd/MM/yy formatter */
    formatDate(d: Date, pattern: 'dd/MM' | 'dd/MM/yy'): string {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        if (pattern === 'dd/MM') return `${dd}/${mm}`;
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    }

    /** Overload equivalent with dates: builds the comment and delegates */
    createDetailWithDates(
        accountType: string,
        accountId: string,
        lineAmountDC: number,
        transactionNum: string,
        executionDate: Date,
        extraInfo: string,
        refDate?: Date | null
    ): XMLBuilder {
        let prefix = '';
        let suffix = '';

        if (refDate && (refDate.getMonth() !== executionDate.getMonth() || refDate.getFullYear() !== executionDate.getFullYear())) {
            // C# checks only Month; if you want exact parity, keep year compare optional.
            prefix = '*';
            suffix = `*${this.formatDate(refDate, 'dd/MM')}`;
        }

        const comment =
            `${prefix}${transactionNum} ${this.formatDate(executionDate, 'dd/MM/yy')} ${extraInfo} ${suffix}`.trimEnd();

        return this.createDetail(accountType, accountId, lineAmountDC, comment);
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


    buildWingsAccounting(rootPath: string, dossierId: string, booking: XMLBuilder): XMLBuilder {

        const ns = "http://www.w3.org/2001/XMLSchema-instance"
        const doc = create({ version: '1.0', encoding: 'UTF-8' });
        const root = doc.ele('WingsAccounting').att('xmlns:xsi', ns);

        const session = root.ele('Session');
        const connection = session.ele('Connection');
        connection.ele('RootPath').txt(rootPath).up();
        connection.ele('DossierID').txt(dossierId).up();

        const bookingBatch = session.ele('BookingBatch');

        // If `this.booking` is a fragment/element, import it directly.
        // If it's a full document, import its root: `bookingBatch.import(this.booking.root())`.
        bookingBatch.import(booking);

        // move back up to the document root to return the full builder
        return doc;
    }




}