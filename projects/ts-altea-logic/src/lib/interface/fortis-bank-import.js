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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortisBankImport = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var csv_import_1 = require("./csv-import");
var dateFns = require("date-fns");
var ts_common_1 = require("ts-common");
var altea_db_1 = require("../general/altea-db");
/*

        let now = new Date()
        let dateString = dateMatches[1] + '/' +  dateFns.getYear(now)

        --> change this code : if month is 12 and we're in January => take previous year !!

    Compare upload with previous upload!!

*/
var FortisBankImport = /** @class */ (function (_super) {
    __extends(FortisBankImport, _super);
    function FortisBankImport(db) {
        var _this = _super.call(this, ts_altea_model_1.BankTransaction) || this;
        if (db instanceof altea_db_1.AlteaDb)
            _this.alteaDb = db;
        else
            _this.alteaDb = new altea_db_1.AlteaDb(db);
        return _this;
    }
    FortisBankImport.prototype.importDefinition = function () {
        return new csv_import_1.ImportDefinition([
            csv_import_1.ImportColumn.string('num', 0),
            csv_import_1.ImportColumn.date('execDate', 1, 'd/M/yyyy', undefined, 'number:yyyyMMdd'),
            csv_import_1.ImportColumn.date('valDate', 2, 'd/M/yyyy', undefined, 'number:yyyyMMdd'),
            csv_import_1.ImportColumn.decimal('amount', 3),
            csv_import_1.ImportColumn.string('cur', 4),
            //       ImportColumn.string('account', 5), we use accountId instead
            csv_import_1.ImportColumn.init('accountId', '438f4d70-65cf-46f5-9ef9-7f7dddef4b37'),
            csv_import_1.ImportColumn.string('remoteAccount', 7),
            csv_import_1.ImportColumn.string('remoteName', 8),
            csv_import_1.ImportColumn.string('info', 9),
            csv_import_1.ImportColumn.string('details', 10),
            csv_import_1.ImportColumn.init('check', 0),
            csv_import_1.ImportColumn.init('ok', false),
        ]);
    };
    FortisBankImport.prototype.import = function (rowsOfCols) {
        return __awaiter(this, void 0, void 0, function () {
            var uploadResult;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // remove the header row
                        rowsOfCols.splice(0, 1);
                        this.importRows(rowsOfCols);
                        this.lines = this.lines.map(function (line) { return _this.customProcessing(line); });
                        return [4 /*yield*/, this.alteaDb.createBankTransactions(this.lines)
                            /*         const dbUpload = new DbObjectMulti<BankTransaction>('bankTransaction', BankTransaction, this.lines)
                                    let uploadResult = await this.alteaDb.db.createMany$<BankTransaction>(dbUpload) */
                        ];
                    case 1:
                        uploadResult = _a.sent();
                        /*         const dbUpload = new DbObjectMulti<BankTransaction>('bankTransaction', BankTransaction, this.lines)
                                let uploadResult = await this.alteaDb.db.createMany$<BankTransaction>(dbUpload) */
                        console.error(uploadResult);
                        console.error(this.lines);
                        return [2 /*return*/];
                }
            });
        });
    };
    FortisBankImport.prototype.customProcessing = function (tx) {
        tx.numInt = this.convertransactionNum(tx.num);
        var info = this.getBankTransactionInfo(tx);
        if (info) {
            tx.type = info.type;
            tx.refDate = info.forDate;
            tx.orig = info.orig;
            tx.cost = info.cost;
        }
        return tx;
    };
    FortisBankImport.prototype.convertransactionNum = function (transactionNum) {
        if (!transactionNum)
            return undefined;
        transactionNum = transactionNum.replace(/\D/g, '');
        return +transactionNum;
    };
    FortisBankImport.prototype.getBankTransactionInfo = function (tx) {
        if (!tx)
            return undefined;
        if (tx.details.toLowerCase().indexOf("stripe") >= 0)
            return new ts_altea_model_1.BankTxInfo(ts_altea_model_1.BankTxType.stripe);
        var txType = ts_altea_model_1.BankTxType.unknown;
        if (tx.details.indexOf('TERMINAL') >= 0) {
            if (tx.details.indexOf("NR.244665") >= 0 || tx.details.indexOf("NR.884543") >= 0)
                txType = ts_altea_model_1.BankTxType.terminalBC;
            else if (tx.details.indexOf("NR.418264") >= 0)
                txType = ts_altea_model_1.BankTxType.onlineBC;
        }
        if (txType == ts_altea_model_1.BankTxType.terminalBC || txType == ts_altea_model_1.BankTxType.onlineBC) {
            var regexDate = /DATUM : (\d+[-/]\d+[-/]\d+)/i;
            var dateMatches = tx.details.match(regexDate);
            if (Array.isArray(dateMatches) && dateMatches.length >= 2) {
                // console.log(dateMatches)
                var dateTimeString = dateMatches[1];
                var transactionDate = dateFns.parse(dateTimeString, 'dd/MM/yyyy', new Date());
                var txInfo = new ts_altea_model_1.BankTxInfo(txType);
                txInfo.forDate = ts_common_1.DateHelper.yyyyMMdd(transactionDate);
                return txInfo;
            }
        }
        var regexAtos = /6660.?0000.?0483/;
        var atosMatches = tx.details.match(regexAtos);
        if (Array.isArray(atosMatches) && atosMatches.length >= 1) {
            if (tx.details.indexOf("81986244") >= 0)
                txType = ts_altea_model_1.BankTxType.terminalCredit;
            else if (tx.details.indexOf("82098696") >= 0)
                txType = ts_altea_model_1.BankTxType.onlineCredit;
            else
                txType = ts_altea_model_1.BankTxType.unidentifiedCredit;
            var dateMatches = tx.details.match(/(\d+\/\d+) BANKREFERENTIE/i);
            var amountMatches = tx.details.match(/BRT:(\d+,\d+)EUR\s*C:0\s*(\d+,\d+)/i);
            console.error(dateMatches);
            if (dateMatches && amountMatches) {
                var now = new Date();
                var dateString = dateMatches[1] + '/' + dateFns.getYear(now);
                var transactionDate = dateFns.parse(dateString, 'dd/MM/yyyy', new Date());
                var origAmount = amountMatches[1];
                var costAmount = amountMatches[2];
                var txInfo = new ts_altea_model_1.BankTxInfo(txType);
                txInfo.forDate = ts_common_1.DateHelper.yyyyMMdd(transactionDate);
                txInfo.orig = parseFloat(origAmount.replace(',', '.'));
                txInfo.cost = parseFloat(costAmount.replace(',', '.'));
                return txInfo;
            }
        }
        return null;
    };
    return FortisBankImport;
}(csv_import_1.CsvImport));
exports.FortisBankImport = FortisBankImport;
