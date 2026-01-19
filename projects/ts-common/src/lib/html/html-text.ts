import { IHtmlItem } from "./html";

export enum HtmlTextType {
    plain = 'plain',
    p = 'p',
    h1 = 'h1',
    h2 = 'h2',
    h3 = 'h3',
    h4 = 'h4',
    h5 = 'h5',
    h6 = 'h6',
    quote = 'quote',
    blockquote = 'blockquote',
}

export class HtmlText implements IHtmlItem {

    text: string
    type: HtmlTextType

    constructor(text: string, type: HtmlTextType = HtmlTextType.plain) {
        this.text = text
        this.type = type
    }

    toHtmlString(): string {
        switch (this.type) {
            case HtmlTextType.plain:
                return this.text
            case HtmlTextType.p:
                return `<p>${this.text}</p>`
            case HtmlTextType.h1:
                return `<h1>${this.text}</h1>`
            case HtmlTextType.h2:
                return `<h2>${this.text}</h2>`
            case HtmlTextType.h3:
                return `<h3>${this.text}</h3>`
            case HtmlTextType.h4:
                return `<h4>${this.text}</h4>`
            case HtmlTextType.h5:
                return `<h5>${this.text}</h5>`
            case HtmlTextType.h6:
                return `<h6>${this.text}</h6>`
            case HtmlTextType.quote:
                return `<blockquote>${this.text}</blockquote>`
            case HtmlTextType.blockquote:
                return `<blockquote>${this.text}</blockquote>`
        }

        return this.text
    }
}