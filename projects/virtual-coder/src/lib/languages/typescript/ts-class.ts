import { List, method } from "lodash";
import { Doc } from "../xml";
import indentString from 'indent-string'
import * as _ from "lodash";
import { Input, ViewChild } from "@angular/core";

const indentChars = 1
const indentOptions = { indent: '\t' }

export class NgComponent {

    constructor(public html: Doc, public code: TsClass) { }
}

export class TsCodeBlock {

    constructor(public code: string, public order: number = 0, public info?: string) { }
}

export class TsImport {

    order = 10

    constructor(public types: string[], public from: string) {

    }

    toString(): string {

 

        return `import { ${this.types.join(', ')} } from '${this.from}'`
    }

    addTypes(...types: string[]) {

        if (!Array.isArray(types))
            return

        types.forEach(type => {
            if (this.types.indexOf(type) == -1)
                this.types.push(type)
        })

    }

}

export enum TsModifier {
    public = 'public',
    private = 'private',
    protected = 'protected',
}

export class TsMethodParam {

    constructor(public name: string, public type?: string, public initialValue?: string, public modifier?: TsModifier) { }

    toString(): string {

        let prop = ''

        if (this.modifier)
            prop += this.modifier + ' '

        prop += this.name

        if (this.type)
            prop += `: ${this.type}`

        if (this.initialValue)
            prop += `= ${this.initialValue}`

        return prop
    }

}

export class TsMethod {

    async: boolean = false
    name: string
    returnType: string
    params: TsMethodParam[] = []

    code: TsCodeBlock[] = []

    constructor(name: string, returnType?: string, public order: number = 10) {
        this.name = name
        this.returnType = returnType
    }

    addParam(name: string, type?: string, initialValue?: string, modifier?: TsModifier) {

        this.params.push(new TsMethodParam(name, type, initialValue, modifier))

    }

    addCode(code: string, order: number = 0, info?: string) {
        this.code.push(new TsCodeBlock(code, order, info))

    }

    toString(): string {

        const params = this.params.map((param: TsMethodParam) => param.toString()).join(', ')

        let methodCode = ''

        let codeBlocks = _.orderBy(this.code, 'order')
        methodCode = codeBlocks.map((block: TsCodeBlock) => block.code).join('\n')

        methodCode = indentString(methodCode, indentChars, indentOptions)



        const async = this.async ? 'async ' : ''

        const method = `
${async}${this.name}(${params}) {
${methodCode}
}`
        return method

    }

}

export class TsProperty {

    decorators?: string[] = []

    constructor(public name: string, public type?: string, public initialValue?: any, public modifier?: TsModifier) { }

    toString(): string {



        // ${decorators}

        let prop = ''

        if (this.modifier)
            prop += this.modifier + ' '

        prop += this.name

        if (this.type)
            prop += `: ${this.type}`

        if (this.initialValue || this.initialValue === true || this.initialValue === false)
            prop += `= ${this.initialValue}`

        let decorators

        if (Array.isArray(this.decorators) && this.decorators.length > 0)
            decorators = this.decorators.join('\n')

        if (decorators) {
            prop = `${decorators}\n${prop}`
        }

        return prop
    }
}

export class TsClass {

    implements: string[] = []
    imports: TsImport[] = []

    properties: TsProperty[] = []

    //constructorParams: string[] = []

    methods: TsMethod[] = []

    constructor(public name) {

    }


    addImport(from: string, ...types: string[]) {

        let imp = this.imports.find(imp => imp.from == from)

        if (imp) {
            imp.addTypes(...types)

        } else {
            imp = new TsImport(types, from)
            this.imports.push(imp)
        }

        return imp
    }

    get construct(): TsMethod {
        return this.addOrGetMethodByName('constructor', 0)
    }

    get ngOnInit(): TsMethod {
        return this.addOrGetMethodByName('ngOnInit', 1)
    }

    addProperty(name: string, type?: string, initialValue?: any, modifier?: TsModifier): TsProperty {

        const prop = new TsProperty(name, type, initialValue, modifier)
        this.properties.push(prop)

        return prop

    }

    addOrGetMethodByName(name: string, order = 10): TsMethod {

        let method = this.methods.find(m => m.name == name)

        if (method)
            return method

        method = new TsMethod(name)
        method.order = order
        this.methods.push(method)

        return method
    }

    toString(): string {


        let imports = _.orderBy(this.imports, 'order')
        const importLines = imports.map((imp: TsImport) => imp.toString()).join('\n')

        console.error(imports)

        let properties = this.properties.map((prop: TsProperty) => prop.toString()).join('\n')
        properties = indentString(properties, indentChars, indentOptions)


        let classImplements = ''

        let methods = ''

        this.methods = _.orderBy(this.methods, 'order')
        methods = this.methods.map((method: TsMethod) => method.toString()).join('\n')
        methods = indentString(methods, indentChars, indentOptions)

        //   const imports = this.imports.forEach(import => )

        const code = `
${importLines}

export class ${this.name} ${classImplements} {

${properties}

${methods}

}
        
        `

        return code

    }

}