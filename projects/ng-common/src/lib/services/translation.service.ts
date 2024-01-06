/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
// import { Translation } from 'ts-common'
import { Translation } from 'ts-common' // 'ts-altea-logic'  //'ts-common'

interface IDictionary<TValue> {
  [id: string]: TValue;
}

export class StringDictionary implements IDictionary<string> {
  [id: string]: string;
}


@Injectable({
  providedIn: 'root'
})
export class TranslationService {



  constructor(private translate: TranslateService) { }

  getTrans(key: string | Array<string>, interpolateParams?: object): Promise<string> {

    const me = this

    return new Promise<string>(function (resolve: any, reject: any) {

      me.translate.get(key, interpolateParams).pipe(take(1)).subscribe((res: string) => {
        resolve(res)
      })
    })

  }





  templateReplaceCache: Map<string, string> = new Map<string, string>()


  async templateReplace$(templateJsonPath: string, stringToReplace: string, replacementJsonPath: string): Promise<string> {

    const combinedKey = `${templateJsonPath}-${stringToReplace}-${replacementJsonPath}`

    if (this.templateReplaceCache.has(combinedKey)) {
      const trans = this.templateReplaceCache.get(combinedKey)
      console.error(`from cache ${trans}`)
      return trans
    }

    let template: string = await this.getTrans(templateJsonPath)

    if (!template)
      template = ''
    else {
      const replacement: string = await this.getTrans(replacementJsonPath)
      template = template.replace(stringToReplace, replacement)
    }

    this.templateReplaceCache.set(combinedKey, template)

    console.warn('after')
    return template
  }


  async getTranslations$(jsonPaths: string[], results: IDictionary<string>, removeFromProperty?: string, appendToProperty?: string): Promise<IDictionary<string>> {

    if (!results)
      results = {}

    for (let jsonPath of jsonPaths) {

      let translation = await this.getTrans(jsonPath)

      if (!translation)
        translation = `Translation not found: ${jsonPath}`

      let resultKey = jsonPath

      if (removeFromProperty)
        resultKey = resultKey.replace(removeFromProperty, '')

      if (appendToProperty)
        resultKey += appendToProperty

      results[resultKey] = translation


    }

    return results

  }

  async templateReplacements$(templateJsonPath: string, results: IDictionary<string>, stringToReplace: string, replacementJsonPaths: string[], removeFromProperty?: string, appendToProperty?: string): Promise<IDictionary<string>> {

    let template: string

    if (!results)
      results = {}

    for (let replacementJsonPath of replacementJsonPaths) {

      const combinedKey = `${templateJsonPath}-${stringToReplace}-${replacementJsonPath}`

      let resultKey = replacementJsonPath
      if (removeFromProperty)
        resultKey = resultKey.replace(removeFromProperty, '')

      if (appendToProperty)
        resultKey += appendToProperty


      if (this.templateReplaceCache.has(combinedKey)) {
        const trans = this.templateReplaceCache.get(combinedKey)
        results[resultKey] = trans
        continue
      }

      let translation = ''

      if (!template)
        template = await this.getTrans(templateJsonPath)

      if (!template) {
        template = 'TEMPLATE NOT FOUND'
        translation = template
      }
      else {
        const replacement: string = await this.getTrans(replacementJsonPath)
        translation = template.replace(stringToReplace, replacement)
      }

      results[resultKey] = translation

      this.templateReplaceCache.set(combinedKey, translation)

    }

    console.warn('after')
    return results

  }




  translateEnum(enumToTranslate: object, jsonTranslationPath: string, result: Translation[], includeHelp: boolean = false): Promise<Translation[]> {

    return new Promise<Translation[]>(this.translateBasicEnum(enumToTranslate, jsonTranslationPath, result, includeHelp))
  }

  translateBasicEnum(enumToTranslate: object, jsonTranslationPath: string, result: Translation[], includeHelp: boolean = false) {

    const me = this

    return function (resolve: any, reject: any) {

      const translationPaths = Object.values(enumToTranslate).map(item => jsonTranslationPath + item)
      console.log(translationPaths);

      me.translate.get(translationPaths).subscribe((res: any) => {

        Object.getOwnPropertyNames(res).forEach(prop => {

          const items = prop.split('.')
          const key = items[items.length - 1]

          result.push(new Translation(key, res[prop]))
        })

        if (includeHelp) {
          me.translateEnumHelp(enumToTranslate, jsonTranslationPath, result, resolve, reject)

        } else {

          resolve(result)
        }

      });

    }
  }


  translateEnumHelp(enumToTranslate: object, jsonTranslationPath: string, result: Translation[], resolve: any, reject: any) {

    const me = this

    const jsonHelpPath = jsonTranslationPath + 'help.'
    const translationPaths = Object.values(enumToTranslate).map(item => jsonHelpPath + item)
    console.log(translationPaths);

    me.translate.get(translationPaths).subscribe((res: any) => {

      Object.getOwnPropertyNames(res).forEach(prop => {

        const items = prop.split('.')
        const key = items[items.length - 1]

        const trans = result.find(t => t.key === key)

        if (trans)
          trans.help = res[prop]
        //result.push(new Translation(key, res[prop]))
      })

      resolve(result)

    });


  }


}
