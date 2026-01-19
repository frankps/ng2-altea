import { IHtmlItem } from "./html"


export class HtmlDoc {

    items: IHtmlItem[] = []


    add(item: IHtmlItem) {
        this.items.push(item)
    }

    toHtmlString(): string {

        const styles = this.defaultStyles()
        const body = this.items.map(item => item.toHtmlString()).join('<br>\n')

        return `<html><head>${styles}</head><body>${body}</body></html>`

    }

    private defaultStyles(): string {
        // Embedded styles for email-friendly tables (avoids per-cell inline styles)
        return `<style>
table.altea-table {
  border-collapse: collapse;
  width: 100%;
  border: 1px solid #d9d9d9;
}
table.altea-table th,
table.altea-table td {
  border: 1px solid #d9d9d9;
  padding: 6px 8px;
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #333;
}
table.altea-table th {
  background: #f5f5f5;
  font-weight: 600;
  text-align: left;
}
</style>`
    }

}