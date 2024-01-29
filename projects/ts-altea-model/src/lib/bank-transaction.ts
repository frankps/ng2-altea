import { ObjectWithId } from "ts-common";

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

}

export class BankTransaction extends ObjectWithId {

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

    account?: string

    /** CounterpartAccount */
    remoteAccount?: string

    /** CounterpartName */
    remoteName?: string

    details?: string

    ok: boolean = false

    createdAt = new Date()
    shortInfo?: string
    info?: string
    type?: string


    providerRef?: string
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
