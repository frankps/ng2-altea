
export class Attribute {
    name: string
    value: string

    constructor(name: string, value: string = null) {
        this.name = name
        this.value = value
    }

    toString() : string {

        return this.value == null?this.name:`${this.name}="${this.value}"`
    }
}