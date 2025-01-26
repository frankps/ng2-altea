import { ArrayHelper } from "../array-helper"


export class HtmlTable {

    rows: any[] = []

    headerRow: boolean = false

    styles = {
        th: null
    }

    addRow(cols: string[]) {
        this.rows.push(cols)
    }


    toHtmlString(): string {



        if (ArrayHelper.IsEmpty(this.rows))
            return ''

        const htmlLines: string[] = []



        htmlLines.push('<table>')

        let rowIdx = 0

        for (let row of this.rows) {

            if (ArrayHelper.IsEmpty(row))
                continue

            htmlLines.push('<tr>')  // this.sanitizer.bypassSecurityTrustHtml

            let colTag = 'td'
            let style = ''

            if (rowIdx == 0 && this.headerRow) {
                colTag = 'th'

                if (this.styles.th)
                    style = ` style="${this.styles.th}"`   // padding:20px
            }


            for (let col of row) {

                let colString = col ? col : ''



                htmlLines.push(`<${colTag}${style}>${colString}</${colTag}>`)   //  style="padding:20px"

            }
            htmlLines.push('</tr>')

            rowIdx++
        }

        htmlLines.push('</table>')

        return htmlLines.join('\n')

    }

}