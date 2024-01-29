import { BankTransaction } from "ts-altea-model"
import * as dateFns from 'date-fns'
import { extend } from "lodash"
import { DateHelper } from "ts-common"

export enum ImportType {
    string,
    date,
    decimal,
    init   // init with specific value
}

export class ImportColumn {

    dateFormat: string
    transform: string

    constructor(public name: string, public type: ImportType, public colNum: number, public defaultValue?: any) {

    }

    static string(name: string, colNum: number, defaultValue?: any): ImportColumn {
        return new ImportColumn(name, ImportType.string, colNum, defaultValue)
    }

    static date(name: string, colNum: number, format: string, defaultValue?: any, transform?: string): ImportColumn {
        const col = new ImportColumn(name, ImportType.date, colNum, defaultValue)
        col.dateFormat = format
        col.transform = transform

        return col
    }

    static decimal(name: string, colNum: number, defaultValue?: any): ImportColumn {
        return new ImportColumn(name, ImportType.decimal, colNum, defaultValue)
    }

    static init(name: string, defaultValue: any): ImportColumn {
        return new ImportColumn(name, ImportType.init, -1, defaultValue)
    }
}

export class ImportDefinition {

    constructor(public columns: ImportColumn[] = []) {

    }
}


export abstract class CsvImport<T> {

    lines: T[] = []

    constructor(protected type: { new(): T; }) {

    }

    abstract importDefinition(): ImportDefinition

    importRows(rowsOfCols: string[][]): T[] {

        const def = this.importDefinition()

        this.lines = rowsOfCols.map(row => this.importRow(row, def))

        return this.lines
    }

    importRow(cols: string[], def: ImportDefinition): T {

        const length = cols.length
        const tx = new this.type // BankTransaction()

        for (let col of def.columns) {

            if (col.colNum >= length)
                continue

            const colData = cols[col.colNum]

            switch (col.type) {

                case ImportType.string:
                    tx[col.name] = colData

                    break

                case ImportType.date:
                    let dateValue : any = dateFns.parse(colData, col.dateFormat, new Date())

                    switch (col.transform) {
                        case 'number:yyyyMMdd':
                            dateValue = DateHelper.yyyyMMdd(dateValue)
                            break


                    }


                    
                    tx[col.name] = dateValue

                    break

                case ImportType.decimal:
                    tx[col.name] = this.stringToDecimal(colData)
                    break


            }
        }


        return tx
    }

    stringToDecimal(txtAmount: string): number {

        // we need to have . as a decimal separator, the fortis interface normally uses , as decimal separator
        // on 1/12/17 Fortis suddenly used '.' as decimal separator
        const dotIdx = txtAmount.indexOf('.')

        if (dotIdx != txtAmount.length - 3) {
            txtAmount = txtAmount.replace('.', '|');
            txtAmount = txtAmount.replace(',', '.');
            txtAmount = txtAmount.replace('|', ',');
        }

        const num = parseFloat(txtAmount)

        return num
    }

}