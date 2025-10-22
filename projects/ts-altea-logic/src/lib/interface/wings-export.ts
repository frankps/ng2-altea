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


export enum WingsExportType {
    cash = "cash",
    gift = "gift",
    bank = "bank",
}

export class WingsExportRequest {

    yearMonth: YearMonth

    branchId: string

    runningNumber: number = -1

    rootPath: string = 'C:\\Program Files\\Wings'
    dossierId: string = '0001'


    runningNumberToString(): string {
        return ("000" + this.runningNumber).slice(-3)
    }

    opDate(): Date {
       

        let opDate = this.yearMonth.lastDayOfMonth()
        opDate = dateFns.setHours(opDate, 12)   // otherwise with TimeZone conversion we can fall into previous/next date

        return opDate
    }

    defaultRunningNumber(): string {

        let month = this.yearMonth.m

        const num = (month + 3) % 12;

        // pad left with zeros to length 3
        return num.toString().padStart(3, "0");
    }
}

export class WingsExportResponse {

    message: string
    xmlString: string

}


export abstract class WingsExportBase {

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

    abstract export(request: WingsExportRequest): Promise<WingsExportResponse>

    createXmlHeader(dagBoek: string, runningNumber: string, opDate: Date, accountID: string, totalAmount: number): XMLBuilder {
        let header = fragment()
            .ele('Booking')
            .ele('Header')
            .ele('Action').txt('1').up()
            .ele('BookCode').txt(dagBoek).up()

        if (runningNumber)
            header = header.ele('RunningNumber').txt(runningNumber).up()

        let opDateString = opDate.toISOString().slice(0, 10).replace(/-/g, '')

        header = header.ele('OpDate').txt(opDateString).up()
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
    createXmlDetail(
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
