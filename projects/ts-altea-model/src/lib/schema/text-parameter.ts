
import 'reflect-metadata'

export enum TextComponent {
  subject,
  body
}

export class TextParameter {

  /** component: location of this parameter (body, header, ...) */
  comp: TextComponent

  /** name of the parameter */
  name: string

  type: 'text' = 'text'

  /** replacement for this parameter or default value */
  value?: string

  /** order/index of parameter within component (WhatsApp is using this number to identify parameter) */
  idx?: number

  static text(name: string, value: string, comp?: TextComponent, idx?: number): TextParameter {

    const param = new TextParameter()
    param.name = name
    param.value = value
    param.comp = comp
    param.idx = idx

    return param
  }
}




