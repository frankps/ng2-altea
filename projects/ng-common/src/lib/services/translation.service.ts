/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
// import { Translation } from 'ts-common'
import { Translation } from 'ts-common' // 'ts-altea-logic'  //'ts-common'


@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  constructor(private translate: TranslateService) { }


  getTrans(key: string | Array<string>, interpolateParams?: object): Promise<any> {

    const me = this

    return new Promise<Translation[]>(function (resolve: any, reject: any) {

      me.translate.get(key, interpolateParams).subscribe((res: string) => {
        resolve(res)
      })
    })

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
