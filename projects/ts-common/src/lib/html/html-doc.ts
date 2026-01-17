import { IHtmlItem } from "./html"


export class HtmlDoc {

    items: IHtmlItem[] = []


    add(item: IHtmlItem) {
        this.items.push(item)
    }

    toHtmlString(): string {

        let html = this.items.map(item => item.toHtmlString()).join('<br>\n')

        return html

    }

}