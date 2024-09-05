
import { ArrayHelper, ObjectWithIdPlus } from 'ts-common'
import { TextComponent, TextParameter } from 'ts-altea-model'
import 'reflect-metadata'
import * as _ from "lodash"

export class ObjectWithParameters extends ObjectWithIdPlus {

  // in case external system will do templating (example: Whatsapp)
  params: TextParameter[]

  addTextParameter(name: string, value?: string) {

    const param = TextParameter.text(name, value)

    if (!this.params)
      this.params = []

    this.params.push(param)
  }

  extractParameterNames(text: string): string[] {

    if (!text)
      return []

    const regex = /\{\{(\w+)\}\}/g;
    let matches = [...text.matchAll(regex)].map(match => match[1])

    if (ArrayHelper.NotEmpty(matches))
      matches = _.uniq(matches)

    return matches
  }

  extractParameters(comp: TextComponent, text: string): TextParameter[] {
    const names = this.extractParameterNames(text)

    let idx = 1
    const params = names.map(name => TextParameter.text(name, null, comp, idx++))

    return params
  }   


}
