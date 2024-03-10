import { BankTransaction, BankTxInfo, BankTxType } from "ts-altea-model"
import { CsvImport, ImportColumn, ImportDefinition } from "./csv-import"
import * as dateFns from 'date-fns'
import { DateHelper, DbObjectMulti } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"


/*

        let now = new Date()
        let dateString = dateMatches[1] + '/' +  dateFns.getYear(now)

        --> change this code : if month is 12 and we're in January => take previous year !!

    Compare upload with previous upload!!

*/


export class FortisBankImport extends CsvImport<BankTransaction> {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {
        super(BankTransaction)

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    importDefinition(): ImportDefinition {

        return new ImportDefinition([
            ImportColumn.string('num', 0),
            ImportColumn.date('execDate', 1, 'd/M/yyyy', undefined, 'number:yyyyMMdd'),
            ImportColumn.date('valDate', 2, 'd/M/yyyy', undefined, 'number:yyyyMMdd'),
            ImportColumn.decimal('amount', 3),
            ImportColumn.string('cur', 4),
            //       ImportColumn.string('account', 5), we use accountId instead
            ImportColumn.init('accountId', '438f4d70-65cf-46f5-9ef9-7f7dddef4b37'),
            ImportColumn.string('remoteAccount', 7),
            ImportColumn.string('remoteName', 8),
            ImportColumn.string('info', 9),
            ImportColumn.string('details', 10),
            ImportColumn.init('check', 0),
            ImportColumn.init('ok', false),

        ])
    }

    async import(rowsOfCols: string[][]) {


        // remove the header row
        rowsOfCols.splice(0, 1)

        this.importRows(rowsOfCols)

        this.lines = this.lines.map(line => this.customProcessing(line))

        let uploadResult = await this.alteaDb.createBankTransactions(this.lines)

/*         const dbUpload = new DbObjectMulti<BankTransaction>('bankTransaction', BankTransaction, this.lines)
        let uploadResult = await this.alteaDb.db.createMany$<BankTransaction>(dbUpload) */

        console.error(uploadResult)

        console.error(this.lines)

    }

    customProcessing(tx: BankTransaction): BankTransaction {

        tx.numInt = this.convertransactionNum(tx.num)

        const info = this.getBankTransactionInfo(tx)

        if (info) {
            tx.type = info.type
            tx.refDate = info.forDate

            tx.orig = info.orig
            tx.cost = info.cost
        }

        return tx
    }


    convertransactionNum(transactionNum: string): number {

        if (!transactionNum)
            return undefined

        transactionNum = transactionNum.replace(/\D/g, '')

        return +transactionNum
    }

    getBankTransactionInfo(tx: BankTransaction): BankTxInfo {

        if (!tx)
            return undefined

        if (tx.details.toLowerCase().indexOf("stripe") >= 0)
            return new BankTxInfo(BankTxType.stripe)

        let txType = BankTxType.unknown

        if (tx.details.indexOf('TERMINAL') >= 0) {

            if (tx.details.indexOf("NR.244665") >= 0 || tx.details.indexOf("NR.884543") >= 0)
                txType = BankTxType.terminalBC;
            else if (tx.details.indexOf("NR.418264") >= 0)
                txType = BankTxType.onlineBC;

        }

        if (txType == BankTxType.terminalBC || txType == BankTxType.onlineBC) {

            const regexDate = /DATUM : (\d+[-/]\d+[-/]\d+)/i

            const dateMatches = tx.details.match(regexDate)

            if (Array.isArray(dateMatches) && dateMatches.length >= 2) {

                // console.log(dateMatches)

                const dateTimeString = dateMatches[1]

                let transactionDate = dateFns.parse(dateTimeString, 'dd/MM/yyyy', new Date())

                let txInfo = new BankTxInfo(txType)
                txInfo.forDate = DateHelper.yyyyMMdd(transactionDate)

                return txInfo
            }
        }


        const regexAtos = /6660.?0000.?0483/
        const atosMatches = tx.details.match(regexAtos)

        if (Array.isArray(atosMatches) && atosMatches.length >= 1) {

            if (tx.details.indexOf("81986244") >= 0)
                txType = BankTxType.terminalCredit
            else if (tx.details.indexOf("82098696") >= 0)
                txType = BankTxType.onlineCredit
            else
                txType = BankTxType.unidentifiedCredit

            const dateMatches = tx.details.match(/(\d+\/\d+) BANKREFERENTIE/i)
            const amountMatches = tx.details.match(/BRT:(\d+,\d+)EUR\s*C:0\s*(\d+,\d+)/i)

            console.error(dateMatches)

            if (dateMatches && amountMatches) {

                let now = new Date()
                let dateString = dateMatches[1] + '/' + dateFns.getYear(now)
                let transactionDate = dateFns.parse(dateString, 'dd/MM/yyyy', new Date())

                let origAmount = amountMatches[1]
                let costAmount = amountMatches[2]

                let txInfo = new BankTxInfo(txType)
                txInfo.forDate = DateHelper.yyyyMMdd(transactionDate)
                txInfo.orig = parseFloat(origAmount.replace(',', '.'))
                txInfo.cost = parseFloat(costAmount.replace(',', '.'))

                return txInfo

            }


        }



        return null


    }




}




