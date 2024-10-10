import { ArrayHelper } from "../array-helper"


export class HtmlTable {

    rows: any[] = []


    addRow(cols: string[]) {
        this.rows.push(cols)
    }


    toString(): string {



        if (ArrayHelper.IsEmpty(this.rows))
            return ''

        const htmlLines : string[] = []

        for (let row of this.rows) {

            if (ArrayHelper.IsEmpty(row))
                continue

            htmlLines.push('<tr>')
            for (let col of row) {
                htmlLines.push(`<td>${col}</td>`)

            }
            htmlLines.push('</tr>')


        }

        return htmlLines.join('\n')

    }

}