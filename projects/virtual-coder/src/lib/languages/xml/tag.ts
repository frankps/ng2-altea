import { Attribute } from "./attribute";
import * as _ from 'underscore'
import * as indent from 'indent-string'
//import * as Model from "../../model";

export interface IXml {
    toString(): string
}

export class XmlContent implements IXml {

    text: string

    constructor(text: string) {
        this.text = text
    }

    toString(): string {
        return this.text
    }

}

export class Doc implements IXml {
    children: Array<IXml> = []

    addTag(name: string): Tag {
        let tag = new Tag(name)
        this.addChild(tag)
        return tag
    }

    addChild(tag: IXml) {
        this.children.push(tag)
    }

    addChildren(...tags: IXml[]) {

        if (!tags)
            return

        tags.forEach(tag => this.children.push(tag))
    }

    addContent(text: string) {
        var content = new XmlContent(text)
        this.addChild(content)
        return this
    }

    /*
addChild(tag: IXml) {
    this.children.push(tag)
}
 
addChildren(...tags: IXml[]) {

    if (!tags)
        return

    tags.forEach(tag => this.children.push(tag))
}



addTag(tagName: string): Tag {

    var tag = new Tag(tagName)
    this.addChild(tag)
    return tag

}
*/
    findSubTag(name: string): Tag {

        if (!this.children || this.children.length == 0)
            return null

        for (let idx = 0; idx < this.children.length; idx++) {

            let child = this.children[idx]

            if (child instanceof Tag && child.name == name) {
                return child
            }
        }

        return null



    }



    toString(): string {


        let content = ''

        if (this.children && this.children.length > 0) {
            if (this.children.length == 1 && this.children[0] instanceof XmlContent) {
                // if just 1 child and this is text, then no carriage returns: <tag>content</tag>

                content = this.children[0].toString()

            } else {

                //  content += '\n'

                this.children.forEach(childTag => content += childTag.toString())

                //content = indent(content, 2)
            }
        }

        return content
    }
}


export class Tag extends Doc {

    name: string = ''
    hasClosingTag: boolean = true

    //  children: Array<IXml> = []

    attributes: Array<Attribute> = []

    constructor(name: string, hasClosingTag: boolean = true, attributes: any[] = null) {
        super()
        this.name = name
        this.hasClosingTag = hasClosingTag

        if (attributes)
            this.addAttributes(attributes)
    }

    addAttributes(attributes: any[]) {
        if (!attributes)
            return this

        attributes.forEach(attr => {

            if (attr instanceof Array) {
                switch (attr.length) {
                    case 2:
                        this.attr(attr[0], attr[1])
                        break
                    case 1:
                        this.attr(attr[0])
                        break
                }
            } else {
                this.attr(attr)
            }
        })

        return this
    }


    static get Div(): Tag { return new Tag('div') }
    static DivWithClass(cls: string): Tag {
        let div = new Tag('div')
        div.attr('class', cls)
        return div
    }

    static get Button(): Tag { return new Tag('button') }

    static get Form(): Tag { return new Tag('form') }

    static IconFontAwesome(cls: string): Tag { return new Tag('i').attr('class', cls) }

    static get Input(): Tag { return new Tag('input', false) }
    static get InputText(): Tag { return Tag.Input.attr('type', 'text') }
    static get InputNumber(): Tag { return Tag.Input.attr('type', 'number') }
    static get InputPassword(): Tag { return Tag.Input.attr('type', 'password') }
    static get InputCheckbox(): Tag { return Tag.Input.attr('type', 'checkbox') }
    static Option(label: string, value: string = null): Tag {
        let optionTag = new Tag('option').addContent(label)
        if (value)
            optionTag.attr('value', value)
        return optionTag
    }
    //static get Select(): SelectTag { return new SelectTag('select') }
    static get TextArea(): Tag { return new Tag('textarea') }


    static get NgbDate(): Tag {
        let inputGroupDiv = Tag.DivWithClass('input-group')    // Div.attr('class', 'input-group')

        let dateInputAttrs = [['class', 'form-control'], ['placeholder', 'dd-mm-yyyy'], ['name', 'dp'], 'ngbDatepicker', ['#d', 'ngbDatepicker'], ['formControlName', 'fromDate']]
        let dateInput = new Tag('input', false, dateInputAttrs)
        inputGroupDiv.addChild(dateInput)

        let divButton = Tag.DivWithClass('input-group-append')
        inputGroupDiv.addChild(divButton)

        // ['','']
        let button = Tag.Button.addAttributes([['class', 'btn btn-outline-secondary calendar'], ['(click)', 'd.toggle()'], ['type', 'button']])
        button.addChild(Tag.IconFontAwesome('fas fa-calendar'))
        divButton.addChild(button)

        return inputGroupDiv
    }



    static get Label(): Tag { return new Tag('label') }


    attr(name: string, value: string = null) {

        let existing = this.attributes.find(a => a && a.name && a.name == name)

        if (existing)
            existing.value = value
        else {
            var attr = new Attribute(name, value)
            this.attributes.push(attr)
        }

        return this
    }

    addClass(className: string) {
        this.appendToAttribute('class', className)
        return this
    }

    appendToAttribute(name: string, toAppend: string, separator = ' ') {
        let existing = this.attributes.find(a => a.name == name)

        if (!existing || !existing.value) {
            this.attr(name, toAppend)
            return
        }

        let value = existing.value

        let items = value.split(separator)
        items.push(toAppend)

        existing.value = items.join(separator)


    }









    override toString(): string {

        let openTag = ''

        if (this.attributes && this.attributes.length > 0) {

            let attributes = _.map(this.attributes, attr => attr.toString())
            let attrString = attributes.join(' ')

            openTag = `<${this.name} ${attrString}>`
        } else
            openTag = `<${this.name}>`

        let content = ''

        if (this.children && this.children.length > 0) {
            if (this.children.length == 1 && this.children[0] instanceof XmlContent) {
                // if just 1 child and this is text, then no carriage returns: <tag>content</tag>

                content = this.children[0].toString()

            } else {

                content += '\n'


                let me = this

                this.children.forEach(childTag => {

                    if (!childTag) {
                        console.log(me)
                        return
                    }

                    content += childTag.toString()                    
                })

                content = indent(content, 2)
            }
        }

        let closeTag = '\n'

        if (this.hasClosingTag)
            closeTag = `</${this.name}>\n`


        return openTag + content + closeTag

    }

}

/* 
export class SelectTag extends Tag {


    addOptions(list: Model.AppList) {

        if (!list || !list.items)
            return


        this.addChildren(...list.items.map((item: Model.AppListItem) => Tag.Option(item.label, item.value)))

        return this
    }

} */