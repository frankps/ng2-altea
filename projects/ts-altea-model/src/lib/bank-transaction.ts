import { DateHelper, ObjectWithId, ObjectWithIdPlus } from "ts-common";
import * as dateFns from 'date-fns'

export enum BankTxType {
    unknown = 'unknown',
    stripe = 'stripe',
    depositTransfer = 'depositTransfer',
    terminalBC = 'terminalBC',
    terminalCredit = 'terminalCredit',
    onlineBC = 'onlineBC',
    onlineCredit = 'onlineCredit',
    unidentifiedCredit = 'unidentifiedCredit'
}

export class BankTxInfo {

    type: BankTxType
    forDate: number // format yyyyMMdd

    orig?: number
    cost?: number

    constructor(type: BankTxType) {
        this.type = type
    }

    forDateTime() {
        return DateHelper.parse(this.forDate)
    }
}

export class BankTransaction extends ObjectWithId {


    accountId?: string

    /** TransactionNum */
    num?: string
    numInt?: number

    /** Execution Date: format yyyyMMdd */
    execDate?: number

    /** Value Date: format yyyyMMdd */
    valDate?: number

    /** Reference Date: format yyyyMMdd */
    refDate?: number


    amount?: number

    /** original amount */
    orig?: number

    cost?: number

    check?: number

    /* currency */
    cur?: string


    /** CounterpartAccount */
    remoteAccount?: string

    /** CounterpartName */
    remoteName?: string

    details?: string

    ok: boolean = false

    createdAt = new Date()
    shortInfo?: string
    info?: string
    type?: BankTxType

    providerRef?: string

    _execDate?: Date
    execDateObject(): Date {

        if (!this.execDate)
            return null

        if (!this._execDate)
            this._execDate = DateHelper.parse(this.execDate)

        return this._execDate
    }



    _refDate?: Date
    refDateObject(): Date {

        if (!this.refDate)
            return null

        if (!this._refDate)
            this._refDate = DateHelper.parse(this.refDate)

        return this._refDate
    }

    _info1: string = null

    info1(): string {

        if (this._info1 != null)
            return this._info1


        const refDate = this.refDateObject()

        let info1 = ''

        if (refDate) {
            info1 += dateFns.format(refDate, 'd/M')
        }

        if (this.type) {

            const type = this.type.toLowerCase()

            if (this.cost > 0 && (type == "kredietkaart" || type.indexOf('credit') >= 0 || type.indexOf('stripe') >= 0)) {

                info1 += ` = ${this.orig} - ${this.cost}`
            }
        }

        this._info1 = info1

        return info1
    }

    /*
    if (tx.Type != null && (tx.Type == "KredietKaart" || tx.Type.Contains("Credit") || tx.Type.Contains("Stripe")))
        {
            if (tx.RefDate.HasValue)
                txText += string.Format(" ({0:d/M} = € {1:0.00} - {2:0.00})", tx.RefDate.Value, tx.AmountOriginal, tx.AmountCost);
        }
        else if (tx.Type != null && (tx.Type == "Terminal" || tx.Type.Contains("BC")))
        {
            if (tx.RefDate.HasValue)
                txText += string.Format(" ({0:d/M})", tx.RefDate.Value);
        }
        else
        {
            if (tx.RefDate.HasValue)
                txText += string.Format(" ({0:d/M H:m})", tx.RefDate.Value);
        }
*/

}


/*


       
        public string TransactionNum { get; set; }
        public System.DateTime ExecutionDate { get; set; }
        public System.DateTime ValueDate { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Account { get; set; }
        public string CounterpartAccount { get; set; }
        public string Details { get; set; }
        public decimal AmountCheck { get; set; }
        public bool CheckOk { get; set; }
        public System.DateTime CreatedOn { get; set; }
        public string ShortInfo { get; set; }
        public string Info { get; set; }
        public string Type { get; set; }
        public Nullable<System.DateTime> RefDate { get; set; }
        public Nullable<decimal> AmountOriginal { get; set; }
        public Nullable<decimal> AmountCost { get; set; }
        
        public Nullable<int> TransactionNumInt { get; set; }
        public string ProviderRef { get; set; }
        public string CounterpartName { get; set; }


public System.Guid BankTransactionId { get; set; }
         public Nullable<System.Guid> BankAccountId { get; set; }
        public Nullable<System.Guid> DocId { get; set; }
public string LinkedBy { get; set; }

        */
