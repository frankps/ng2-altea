import { Template, TextComponent } from "ts-altea-model"
import { ArrayHelper } from "ts-common"



/**
 * https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components
 * 
 */
export class WhatsAppTemplateComponent {

    // format: 'TEXT' | 'IMAGE' | 'LOCATION' = 'TEXT'    >> mag niet gebruikt worden bij BODY

    constructor(public type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS', public text?: string) {

    }
}

export class WhatsAppBodyComponent extends WhatsAppTemplateComponent {

    example = {
        body_text: []
    }

    constructor(text: string = "", sampleValues: string[] = []) {
        super('BODY', text)

        if (ArrayHelper.NotEmpty(sampleValues))
            this.example.body_text.push(sampleValues)
    }
}


export class WhatsAppHeaderComponent extends WhatsAppTemplateComponent {

    example = {
        header_text: []
    }

    format = "TEXT"

    constructor(text: string = "", sampleValues: string[] = []) {
        super('HEADER', text)

        if (ArrayHelper.NotEmpty(sampleValues))
            this.example.header_text.push(...sampleValues)
    }
}

export class WhatsAppTemplateBase {



}


export class WhatsAppTemplateUpdate {

    params: any

    constructor(public id: string) {

    }

    components: WhatsAppTemplateComponent[] = []

    static fromTemplate(tpl: Template): WhatsAppTemplateUpdate {

        const waTpl = new WhatsAppTemplateUpdate(tpl.extId)
        waTpl.components.push(...tpl.getWhatsAppComponents())

        return waTpl
    }

}


/**
 * https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components
 * 
 */
export class WhatsAppTemplate {


    allow_category_change = true


    components: WhatsAppTemplateComponent[] = []

    constructor(public name: string, public category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY' = 'UTILITY', public language: string = 'nl') {

    }

    static fromTemplate(tpl: Template): WhatsAppTemplate {

        const waTpl = new WhatsAppTemplate(tpl.code)
        waTpl.components.push(...tpl.getWhatsAppComponents())

        return waTpl
    }

}

export class WhatsAppCreateResult {
    id: string
    status: string
    category: string
}

export class WhatsAppUpdateResult {
    success: boolean
}