import { ta } from 'date-fns/locale'
import * as vc from 'virtual-coder'
import * as sc from 'stringcase'
import { NgCommonModule } from 'ng-common'

/*

{
    "type": "form"
}

    async getOrderlinesByIds(ids: string[]): Promise<OrderLine[]> {
        const objects = await this.getObjectsByIds('orderLine', OrderLine, ids)
        return objects
    }

    async createOrderlines(orderLines: OrderLine[]): Promise<ApiListResult<OrderLine>> {
        let createResult = await this.createObjects('orderLine', OrderLine, orderLines)
        return createResult
    }

    async updateOrderline(orderLine: OrderLine, propertiesToUpdate: string[]): Promise<ApiResult<OrderLine>> {
        let updateResult = await this.updateObject('orderLine', OrderLine, orderLine, propertiesToUpdate)
        return updateResult
    }

    async updateOrderlines(orderLines: OrderLine[], propertiesToUpdate: string[]): Promise<ApiListResult<OrderLine>> {
        let updateResult = await this.updateObjects('orderLine', OrderLine, orderLines, propertiesToUpdate)
        return updateResult
    }

 camel "fooBar"
 pascal "FooBar" 


%pascal_singular%    Orderline
%pascal_plural%      Orderlines

%camel_singular%     orderLine
%camel_plural%       orderLines

*/

export interface DbMethodsSpec {

    /** type name singular, example: OrderLine */
    typeName: string

    /** type name plural, example: OrderLines */
    plural: string
}

let dmMethodTemplate = `
async get%pascal_plural%ByIds(ids: string[]): Promise<%pascal_singular%[]> {
    const objects = await this.getObjectsByIds('%camel_singular%', %pascal_singular% , ids)
    return objects
}

async create%pascal_plural%(%camel_plural%: %pascal_singular% []): Promise<ApiListResult<%pascal_singular%>> {
    let createResult = await this.createObjects('%camel_singular%', %pascal_singular% , %camel_plural%)
    return createResult
}

async update%pascal_singular%(%camel_singular%: %pascal_singular% , propertiesToUpdate: string[]): Promise<ApiResult<%pascal_singular%>> {
    let updateResult = await this.updateObject('%camel_singular%', %pascal_singular% , %camel_singular%, propertiesToUpdate)
    return updateResult
}

async update%pascal_plural%(%camel_plural%: %pascal_singular% [], propertiesToUpdate: string[]): Promise<ApiListResult<%pascal_singular%>> {
    let updateResult = await this.updateObjects('%camel_singular%', %pascal_singular% , %camel_plural%, propertiesToUpdate)
    return updateResult
}
`

export class DbMethodsGenerator {

    constructor(public dbMethodsSpec: DbMethodsSpec) {

    }

    // params = params.replace(')', '')

    generate() {

        let typeSingular = this.dbMethodsSpec.typeName
        let typePlural = this.dbMethodsSpec.plural

        if (!typePlural)
            typePlural = typeSingular + 's'

        let camel_singular = sc.camelcase(typeSingular)
        let camel_plural = sc.camelcase(typePlural)

        let pascal_singular = sc.pascalcase(typeSingular)
        let pascal_plural = sc.pascalcase(typePlural)

        dmMethodTemplate = dmMethodTemplate.replace(/\%camel_singular\%/g, camel_singular)
        dmMethodTemplate = dmMethodTemplate.replace(/\%camel_plural\%/g, camel_plural)

        dmMethodTemplate = dmMethodTemplate.replace(/\%pascal_singular\%/g, pascal_singular)
        dmMethodTemplate = dmMethodTemplate.replace(/\%pascal_plural\%/g, pascal_plural)

        return dmMethodTemplate
    }
}
