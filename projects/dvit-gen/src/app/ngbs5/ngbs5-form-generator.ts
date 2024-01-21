import { ta } from 'date-fns/locale'
import * as vc from 'virtual-coder'
import * as sc from 'stringcase'
import { NgCommonModule } from 'ng-common'

export class Ngbs5FormGenerator {

    constructor(public formSpec: any) {

    }


    generate(): vc.NgComponent {

        console.warn(this.formSpec)

        let html = new vc.Doc()

        let name = this.formSpec?.name

        let tsClass = new vc.TsClass('Form')
        tsClass.addImport('@angular/core', 'Component', 'OnInit').order = 0

        if (this.formSpec.bind.to) {
            if (this.formSpec.bind.type)
                tsClass.addProperty(this.formSpec.bind.to, this.formSpec.bind.type, `new ${this.formSpec.bind.type}()`)
            else
                tsClass.addProperty(this.formSpec.bind.to)

            if (this.formSpec.bind?.type && this.formSpec.bind?.import) {
                tsClass.addImport(this.formSpec.bind.import, this.formSpec.bind.type)
            }
        }

        if (this.formSpec.rows.generate == true) {

            tsClass.addProperty('css_cls_row', undefined, "'mt-3'")
        }

        const ngOnInit = tsClass.addOrGetMethodByName('ngOnInit')
        ngOnInit.async = true

        tsClass.addProperty('initialized', undefined, false)
        ngOnInit.addCode('this.initialized = true', 1000) // 1000: to make sure it appears at the end of ngOnInit
        tsClass.implements.push('OnInit')

        let htmlElementContainer = html

        let formName
        if (this.formSpec?.form?.tag == true) {
            const formTag = vc.Tag.Form

            formName = `${sc.camelcase(name)}Form`

            formTag.attr(`#${formName}`, "ngForm")
            html.addChild(formTag)

            //   @ViewChild('generalForm') generalForm: NgForm;
            const formProperty = tsClass.addProperty(formName, 'NgForm')
            formProperty.decorators.push(`@ViewChild('${formName}')`)
            tsClass.addImport('@angular/core', 'ViewChild')
            tsClass.addImport('@angular/forms', 'NgForm').order = 1

            htmlElementContainer = formTag
        }


        if (this.formSpec.elements) {

            const elements = this.formSpec.elements

            Object.keys(this.formSpec.elements).forEach(elementName => {

                const elementSpec = elements[elementName]

                let tag = this.generateElement(elementName, elementSpec, this.formSpec, formName, tsClass)

                if (tag)
                    htmlElementContainer.addChild(tag)
            })

        }

        console.warn(html)

        return new vc.NgComponent(html, tsClass)

    }


    /**
     * Parses name and params out of declaration (example: test($event))
     * 
     * @param signature 
     * @returns 
     */
    parseMethodSignature(signature: string): vc.TsMethod {

        let items = signature.split('(')

        let methodName = ''

        methodName = items[0]

        let method = new vc.TsMethod(methodName)

        if (items.length > 0) {
            let params = items[1]
            params = params.replace(')', '')

            let paramItems = params.split(',')

            paramItems.forEach(paramItem => method.addParam(paramItem))

        }

        return method
    }


    generateElement(name, elementSpec, formSpec, formName, tsClass: vc.TsClass): vc.Tag {

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

                const buttonClasses = []

                buttonClasses.push('btn')

                if (elementSpec.class) {

                    let buttonStyle = 'primary'
                    if (elementSpec.class.style && elementSpec.class.style != 'default')
                        buttonStyle = elementSpec.class.style

                    if (elementSpec.class.outline === true)
                        buttonStyle = `btn-outline-${buttonStyle}`
                    else
                        buttonStyle = `btn-${buttonStyle}`

                    buttonClasses.push(buttonStyle)

                    switch (elementSpec.class.size) {
                        case 'large':
                        case 'lg':
                            buttonClasses.push('btn-lg')
                            break
                        case 'small':
                        case 'sm':
                            buttonClasses.push('btn-sm')
                            break
                    }



                }

                let buttonClass = buttonClasses.join(' ')
                /*
                                if (elementSpec?.class)
                                    buttonClass = `btn ${elementSpec?.class}`
                */
                elementTag.attr('class', buttonClass)

                //if (elementSpec.translate) {
                elementTag.attr('translate')

                const translationPath = this.getLabelTranslationPath(formSpec, elementSpec, elementName)
                elementTag.addContent(translationPath)


                let clickMethod: vc.TsMethod

                if (elementSpec.click) {
                    elementTag.attr('(click)', elementSpec.click)
                    clickMethod = this.parseMethodSignature(elementSpec.click)


                    if (clickMethod) {
                        clickMethod.addCode(`console.warn("Button '${elementName}' clicked: '${clickMethod.name}' method triggered!")`)

                        if (formSpec.bind?.to)
                            clickMethod.addCode(`console.warn(this.${formSpec.bind?.to})`)

                        tsClass.methods.push(clickMethod)
                    }
                }

                // [disabled]="giftForm.form.pristine || !giftForm.form.valid || !this.gift.methodSelected()"

                if (elementSpec.disabled?.enable === true) {

                    let disabledStatements = []

                    if (typeof elementSpec.disabled?.pristine == 'boolean') {
                        const prefix = elementSpec.disabled.pristine ? '' : '!'
                        disabledStatements.push(`${prefix}${formName}.form.pristine`)
                    }

                    if (typeof elementSpec.disabled?.valid == 'boolean') {
                        const prefix = elementSpec.disabled.valid ? '' : '!'
                        disabledStatements.push(`${prefix}${formName}.form.valid`)
                    }

                    elementTag.attr('[disabled]', disabledStatements.join(' || '))
                }

                // block (=full width button), then we place button inside another div container
                if (elementSpec.class.block === true) {
                    let buttonContainer = vc.Tag.Div.addClass("d-grid gap-2")
                    buttonContainer.addChild(elementTag)
                    elementTag = buttonContainer
                }

                if (elementSpec.eventEmitter?.enable === true) {

                    tsClass.addImport('@angular/core', 'Output', 'EventEmitter')

                    let eventEmitterType = elementSpec.eventEmitter.type

                    if (!eventEmitterType)
                        eventEmitterType = formSpec.bind.type

                    eventEmitterType = `EventEmitter<${eventEmitterType}>`

                    const eventProp = tsClass.addProperty(elementSpec.eventEmitter.name, eventEmitterType, `new ${eventEmitterType}()`)
                    eventProp.decorators.push('@Output()')

                    if (clickMethod) {
                        let emitValue = elementSpec.eventEmitter.value

                        if (!emitValue)
                            emitValue = formSpec.bind.to

                        clickMethod.addCode(`this.${elementSpec.eventEmitter.name}.emit(this.${emitValue})`)
                    }
                }


                break

            case 'ng-select':

                elementTag = new vc.Tag('ng-select', true)
                this.addAttributes(elementSpec, elementTag, elementName, true, true, false, false)

                if (elementSpec?.source?.mode == "enum") {
                    let bindToCollection = sc.camelcase(elementSpec?.source?.name)

                    elementTag.attr('*ngIf', 'initialized')
                    elementTag.attr('[items]', bindToCollection)
                    elementTag.attr('bindLabel', 'trans')
                    elementTag.attr('bindValue', 'key')

                    elementTag.attr('[clearable]', elementSpec?.clearable ? 'true' : 'false')
                    elementTag.attr('[multiple]', elementSpec?.multiple ? 'true' : 'false')

                    this.ngSelectBindToEnum(bindToCollection, tsClass, elementSpec, elementName)

                    console.error(tsClass)
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

        }


        if (elementType != 'button') {

            const labelTag = this.addLabel(formSpec, elementSpec, elementName, elementTag)

            if (labelTag)
                rootTag = labelTag
        }



        if (formSpec.rows.generate == true) {

            let rowTag = vc.Tag.DivWithClass('row')

            rowTag.appendToAttribute('class', '{{css_cls_row}}')

            let colTag = vc.Tag.DivWithClass('col')

            rowTag.addChild(colTag)

            colTag.addChild(rootTag)

            rootTag = rowTag
        }




        // [(ngModel)]="template.name"

        return rootTag

    }


    ngSelectBindToEnum(bindToCollection: string, tsClass: vc.TsClass, elementSpec, elementName) {

        tsClass.addImport('ng-common', 'TranslationService')
        tsClass.addImport('ts-common', 'Translation')

        tsClass.addProperty(bindToCollection, 'Translation[]', '[]')

        tsClass.construct.addParam('translationSvc', 'TranslationService', undefined, vc.TsModifier.protected)

        const enumName = elementSpec.source.name
        const enumTranslatePath = elementSpec.source.translate

        if (elementSpec?.source?.import) {
            tsClass.addImport(elementSpec?.source?.import, enumName)
        }

        tsClass.ngOnInit.addCode(`await this.translationSvc.translateEnum(${enumName}, '${enumTranslatePath}.', this.${bindToCollection})`)

    }

    getLabelTranslationPath(formSpec, elementSpec, elementName): string {

        let label = ''

        if (elementSpec.translate) {

            if (elementSpec.translate.startsWith('.'))
                label = `${formSpec.label.translate}${elementSpec.translate}`
            else
                label = elementSpec.translate

        } else {
            label = `${formSpec.label.translate}.${elementName}`
        }

        return label


    }

    addLabel(formSpec, elementSpec, elementName, elementTag) {

        if (formSpec.label.mode == "ngx-altea-label-control") {

            let labelTag = new vc.Tag('ngx-altea-label-control')

            let formTranslateRoot = formSpec.label.translate

            const label = this.getLabelTranslationPath(formSpec, elementSpec, elementName)

            labelTag.attr('label', label)
            labelTag.attr('for', elementName)
            labelTag.addChild(elementTag)

            return labelTag
            //rootTag = labelTag
        }

        return null

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

