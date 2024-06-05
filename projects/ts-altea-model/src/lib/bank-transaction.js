"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTransaction = exports.BankTxInfo = exports.BankTxType = void 0;
var ts_common_1 = require("ts-common");
var BankTxType;
(function (BankTxType) {
    BankTxType["unknown"] = "unknown";
    BankTxType["stripe"] = "stripe";
    BankTxType["depositTransfer"] = "depositTransfer";
    BankTxType["terminalBC"] = "terminalBC";
    BankTxType["terminalCredit"] = "terminalCredit";
    BankTxType["onlineBC"] = "onlineBC";
    BankTxType["onlineCredit"] = "onlineCredit";
    BankTxType["unidentifiedCredit"] = "unidentifiedCredit";
})(BankTxType || (exports.BankTxType = BankTxType = {}));
var BankTxInfo = /** @class */ (function () {
    function BankTxInfo(type) {
        this.type = type;
    }
    return BankTxInfo;
}());
exports.BankTxInfo = BankTxInfo;
var BankTransaction = /** @class */ (function (_super) {
    __extends(BankTransaction, _super);
    function BankTransaction() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ok = false;
        _this.createdAt = new Date();
        return _this;
    }
    return BankTransaction;
}(ts_common_1.ObjectWithId));
exports.BankTransaction = BankTransaction;
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
