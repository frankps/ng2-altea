import { ta } from 'date-fns/locale'
import * as vc from 'virtual-coder'
import * as sc from 'stringcase'

export class Ngbs5FormGenerator {

    constructor(public formSpec: any) {

    }


    generate(): vc.Doc {

        console.warn(this.formSpec)

        let html = new vc.Doc()

        if (this.formSpec.elements) {

            const elements = this.formSpec.elements

            Object.keys(this.formSpec.elements).forEach(elementName => {

                const element = elements[elementName]

                let tag = this.generateElement(elementName, element, this.formSpec)

                if (tag)
                    html.addChild(tag)
            })

        }

        console.warn(html)

        return html

    }




    generateElement(name, elementSpec, formSpec): vc.Tag {

        console.error(elementSpec)

        const elementName = name

        const elementType = elementSpec.type

        let elementTag: vc.Tag

        switch (elementType) {

            case 'text':
                elementTag = vc.Tag.InputText

                break

            case 'number':
                elementTag = vc.Tag.InputNumber
                break

            case 'textarea':
                elementTag = vc.Tag.TextArea
                break

            case 'button':
                // <button type="button" class="btn btn-primary btn-sm" (click)="addScheduling()" translate>dic.add</button>
                elementTag = vc.Tag.Button

                elementTag.attr('class', 'btn btn-primary')
                if (elementSpec.translate) {
                    elementTag.attr('translate')
                }

                if (elementSpec.click)
                    elementTag.attr('click', elementSpec.click)
                break

            case 'ng-select':

                elementTag = new vc.Tag('ng-select', true)
                this.addAttributes(elementSpec, elementTag, elementName, true, true, false, false)
                
                if (elementSpec?.source?.mode == "enum") {
                    let bindToCollection = sc.camelcase(elementSpec?.source?.name)

                    elementTag.attr('[items]', bindToCollection)
                    elementTag.attr('bindLabel', 'trans')
                    elementTag.attr('bindValue', 'key')

                    elementTag.attr('[clearable]', elementSpec?.clearable?'true':'false')
                    elementTag.attr('[multiple]', elementSpec?.multiple?'true':'false')
                }

                this.addBinding(formSpec, elementSpec, elementName, elementTag)

                break

            default:

        }

        if (!elementTag)
            return elementTag

        let rootTag = elementTag


        if (['text', 'number', 'textarea'].indexOf(elementType) >= 0) {
            this.addAttributes(elementSpec, elementTag, elementName, true, true, true, true)

            this.addBinding(formSpec, elementSpec, elementName, elementTag)

            if (formSpec.label.mode == "ngx-altea-label-control") {

                let labelTag = new vc.Tag('ngx-altea-label-control')

                const label = `${formSpec.label.translate}.${elementName}`

                labelTag.attr('label', label)
                labelTag.attr('for', elementName)
                labelTag.addChild(elementTag)
                rootTag = labelTag
            }
        }


        if (formSpec.rows.generate == true) {

            let rowTag = vc.Tag.DivWithClass('row')


            let colTag = vc.Tag.DivWithClass('col')

            rowTag.addChild(colTag)

            colTag.addChild(rootTag)

            rootTag = rowTag
        }




        // [(ngModel)]="template.name"

        return rootTag

    }

    addBinding(formSpec, elementSpec, elementName, elementTag) {

        if (formSpec.bind.mode == "ngModel") {
            const bindTo = `${formSpec.bind.to}.${elementName}`
            elementTag.attr('[(ngModel)]', bindTo)
        }

    }

    addAttributes(elementSpec, elementTag, elementName, id: boolean, name: boolean, formControl: boolean, requiredIfNeeded: boolean) {

        if (id)
            elementTag.attr('id', elementName)

        if (name)
            elementTag.attr('name', elementName)

        if (formControl)
            elementTag.attr('class', 'form-control')

        if (requiredIfNeeded) {
            const required = elementSpec?.required

            if (required == true)
                elementTag.attr('required')
        }

    }


}

