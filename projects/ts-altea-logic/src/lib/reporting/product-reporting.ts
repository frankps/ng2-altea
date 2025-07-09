import { DateHelper, DbQueryTyped, QueryOperator } from "ts-common"
import { AlteaDb } from "../general/altea-db"
import { IDb } from "../interfaces/i-db"
import { Order, OrderLine, OrderLineOption, OrderState, Product } from "ts-altea-model"
import * as dateFns from 'date-fns'

export class ProductReport {

    lines: ProductReportLine[] = []

    toCsv(): string {

        let csv = 'gemaakt,afspraak,status,betaald,product,customer,customerSince,options\n'

        let lines: string[] = []

        for (let line of this.lines) {

            let options = line.options.filter(o => o.firstValueVal() > 0).map(o => `${o.name}:${o.getValueVals().join(',')}`).join(',')

            lines.push(`${line.createdNum},${line.appointmentNum},${line.order.state},${line.paid},${line.name},${line.customer},${line.customerSince},${options}`)
        }

        // lines.sort((a, b) => a.localeCompare(b))

        csv += lines.join('\n')

        return csv
    }
}

export class ProductReportLine {
    appointment: Date
    appointmentNum: string

    createdNum: string

    name: string
    paid: number = 0
    customer: string
    customerSince: string

    product: Product
    options: OrderLineOption[]


    order: Order
    line: OrderLine
}

export class ProductReporting {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async bodySculptorReporting(): Promise<ProductReport> {

        let branchId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

        let startDate = new Date(2024, 9, 1)
        let endDate = new Date()

        let report = new ProductReport()

        let revealTestBeurt = 'ebdfbfc2-e483-4919-b0ff-c69d0275b39e'
        let revealLightTestBeurt = 'd7381fc3-a3f8-429d-8dab-4099a1c8c94d'
        let bodySculptorAbo = '3a52a26d-6cf7-4f56-bfcc-049d44fd9402'
        let bodySculptorReveal30MinAbo = '4154961f-1cf0-4d77-a266-b2b3476f8662'
        let bodySculptorReveal45MinAbo = '4bfccc8b-aae8-469c-965c-e7e6afde932e'

        let productIds = [revealTestBeurt, revealLightTestBeurt, bodySculptorAbo, bodySculptorReveal30MinAbo, bodySculptorReveal45MinAbo]

        let orders = await this.getProductReport(branchId, startDate, endDate, productIds)

        for (let order of orders) {

            let totalPaid = order.paid

            let orderLines = order.lines.filter(l => productIds.includes(l.productId))

            for (let orderLine of orderLines) {

                let reportLine = new ProductReportLine()
                reportLine.appointment = order.startDate

                if (order.startDate)
                    reportLine.appointmentNum = dateFns.format(order.startDate, 'yyyyMMdd')

                reportLine.createdNum = dateFns.format(order.cre, 'yyyyMMdd')

                reportLine.product = orderLine.product
                reportLine.name = orderLine.product.name

                if (order.contact) {
                    reportLine.customer = order.contact?.name
                    reportLine.customerSince = dateFns.format(order.contact.cre, 'yyyyMMdd')
                }
                reportLine.options = orderLine.options
                reportLine.order = order
                reportLine.line = orderLine

                if (totalPaid >= orderLine.incl)
                    reportLine.paid = orderLine.incl

                report.lines.push(reportLine)

            }

        }

        return report
    }



    async getProductReport(branchId: string, startDate: Date, endDate: Date, productIds: string[]) {

        let startNum = DateHelper.yyyyMMddhhmmss(startDate)
        let endNum = DateHelper.yyyyMMddhhmmss(endDate)

        // noStates: [OrderState.cancelled], 
        let orders = await this.alteaDb.getOrdersForProducts(branchId, startDate, endDate, productIds, { includes: ['contact'], noStates: [OrderState.cancelled], useCreationDate: true })

        return orders

    }
}

