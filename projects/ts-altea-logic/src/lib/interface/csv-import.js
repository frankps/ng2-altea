"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvImport = exports.ImportDefinition = exports.ImportColumn = exports.ImportType = void 0;
var dateFns = require("date-fns");
var ts_common_1 = require("ts-common");
var ImportType;
(function (ImportType) {
    ImportType[ImportType["string"] = 0] = "string";
    ImportType[ImportType["date"] = 1] = "date";
    ImportType[ImportType["decimal"] = 2] = "decimal";
    ImportType[ImportType["init"] = 3] = "init"; // init with specific value
})(ImportType || (exports.ImportType = ImportType = {}));
var ImportColumn = /** @class */ (function () {
    function ImportColumn(name, type, colNum, defaultValue) {
        this.name = name;
        this.type = type;
        this.colNum = colNum;
        this.defaultValue = defaultValue;
    }
    ImportColumn.string = function (name, colNum, defaultValue) {
        return new ImportColumn(name, ImportType.string, colNum, defaultValue);
    };
    ImportColumn.date = function (name, colNum, format, defaultValue, transform) {
        var col = new ImportColumn(name, ImportType.date, colNum, defaultValue);
        col.dateFormat = format;
        col.transform = transform;
        return col;
    };
    ImportColumn.decimal = function (name, colNum, defaultValue) {
        return new ImportColumn(name, ImportType.decimal, colNum, defaultValue);
    };
    ImportColumn.init = function (name, defaultValue) {
        return new ImportColumn(name, ImportType.init, -1, defaultValue);
    };
    return ImportColumn;
}());
exports.ImportColumn = ImportColumn;
var ImportDefinition = /** @class */ (function () {
    function ImportDefinition(columns) {
        if (columns === void 0) { columns = []; }
        this.columns = columns;
    }
    return ImportDefinition;
}());
exports.ImportDefinition = ImportDefinition;
var CsvImport = /** @class */ (function () {
    function CsvImport(type) {
        this.type = type;
        this.lines = [];
    }
    CsvImport.prototype.importRows = function (rowsOfCols) {
        var _this = this;
        var def = this.importDefinition();
        this.lines = rowsOfCols.map(function (row) { return _this.importRow(row, def); });
        return this.lines;
    };
    CsvImport.prototype.importRow = function (cols, def) {
        var length = cols.length;
        var tx = new this.type; // BankTransaction()
        for (var _i = 0, _a = def.columns; _i < _a.length; _i++) {
            var col = _a[_i];
            if (col.colNum >= length)
                continue;
            var colData = cols[col.colNum];
            switch (col.type) {
                case ImportType.string:
                    tx[col.name] = colData;
                    break;
                case ImportType.date:
                    var dateValue = dateFns.parse(colData, col.dateFormat, new Date());
                    switch (col.transform) {
                        case 'number:yyyyMMdd':
                            dateValue = ts_common_1.DateHelper.yyyyMMdd(dateValue);
                            break;
                    }
                    tx[col.name] = dateValue;
                    break;
                case ImportType.decimal:
                    tx[col.name] = this.stringToDecimal(colData);
                    break;
                case ImportType.init:
                    tx[col.name] = col.defaultValue;
            }
        }
        return tx;
    };
    CsvImport.prototype.stringToDecimal = function (txtAmount) {
        // we need to have . as a decimal separator, the fortis interface normally uses , as decimal separator
        // on 1/12/17 Fortis suddenly used '.' as decimal separator
        var dotIdx = txtAmount.indexOf('.');
        if (dotIdx != txtAmount.length - 3) {
            txtAmount = txtAmount.replace('.', '|');
            txtAmount = txtAmount.replace(',', '.');
            txtAmount = txtAmount.replace('|', ',');
        }
        var num = parseFloat(txtAmount);
        return num;
    };
    return CsvImport;
}());
exports.CsvImport = CsvImport;
