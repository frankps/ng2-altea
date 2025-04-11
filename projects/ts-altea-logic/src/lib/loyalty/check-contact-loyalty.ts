import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"
import { LoyaltyByProgram, LoyaltyMgmtService } from 'ts-altea-logic'
import { BankTransaction, BankTxType, Invoice, LoyaltyCard, LoyaltyCardChange, LoyaltyProgram, Order, Payment, PaymentInfo, Payments, PaymentType, StripePayout } from 'ts-altea-model'
import { ApiStatus, ArrayHelper, DateHelper, HtmlTable, SortOrder, YearMonth } from 'ts-common'


export class ContactLoyaltyLine {

    type: 'order' | 'init'

    loyalty: Map<string, LoyaltyCardChange[]> = new Map<string, LoyaltyCardChange[]>()

    recalculated: LoyaltyByProgram

    constructor(public order?: Order) {

        if (order) {

            this.type = 'order'

            if (order?.hasLoyalty()) {

                for (let loyalty of order.loyalty) {

                    let cardId = loyalty.cardId

                    this.addLoyalty(cardId, loyalty)
                }

            }
        }



    }

    addLoyalty(cardId: string, ...loyalty: LoyaltyCardChange[]) {

        if (ArrayHelper.IsEmpty(loyalty))
            return

        let changesForCard: LoyaltyCardChange[] = []

        if (this.loyalty.has(cardId))
            changesForCard = this.loyalty.get(cardId)
        else {
            this.loyalty.set(cardId, changesForCard)
        }

        changesForCard.push(...loyalty)

    }

    getLoyaltyForCard(cardId: string): LoyaltyCardChange[] {

        if (!this.loyalty)
            return []

        if (this.loyalty.has(cardId))
            return this.loyalty.get(cardId)
        else
            return []
    }

}

export class ContactLoyaltyReport {

    lines: ContactLoyaltyLine[] = []

    totals: Map<string, number> = new Map<string, number>()


    orders: Order[]
    cards: LoyaltyCard[]


    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {   // public branchId, 

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    /*
        constructor1(public loyaltyMgmtSvc: LoyaltyMgmtService, public orders: Order[], public cards: LoyaltyCard[], public loyaltyPrograms: LoyaltyProgram[]) {
    
    
        }
            */

    async processContactData(orders: Order[], cards: LoyaltyCard[], loyaltyPrograms: LoyaltyProgram[]) {

        let loyaltyMgmtSvc = new LoyaltyMgmtService(this.alteaDb)

        orders = _.orderBy(orders, o => o.startOrCreationDate())

        if (ArrayHelper.NotEmpty(cards)) {

            let initLine = new ContactLoyaltyLine()

            initLine.type = 'init'

            for (let card of cards) {

                let inits = card.getChangesByInfo('INIT')
                initLine.addLoyalty(card.id, ...inits)

            }

            this.addLine(initLine)
        }

        for (let order of orders) {

            let line = new ContactLoyaltyLine(order)
            line.recalculated = await loyaltyMgmtSvc.calculateLoyalty(order, loyaltyPrograms, true)

            this.addLine(line)
        }

    }

    async loadContactData(contactId: string) {

        let contact = await this.alteaDb.getContactById(contactId)

        this.orders = await this.alteaDb.getOrdersForContact(contactId, ['lines.product', 'payments', 'loyalty'], 200, 'cre', SortOrder.asc)  // , ['contact', 'payment']

        this.cards = await this.alteaDb.getLoyaltyCards(contactId, ['changes'])

        let loyaltyPrograms = await this.alteaDb.getLoyaltyPrograms(contact.branchId)

        await this.processContactData(this.orders, this.cards, loyaltyPrograms)
    }

    getTotal(cardId: string) {

        if (!this.totals.has(cardId))
            return 0

        let total = this.totals.get(cardId)

        return total
    }

    setTotal(cardId: string, total: number) {

        this.totals.set(cardId, total)
    }




    addLine(line: ContactLoyaltyLine) {

        if (!line)
            return


        for (let cardId of line.loyalty.keys()) {

            let loyalties = line.loyalty.get(cardId)

            let total = this.getTotal(cardId)

            for (let loyalty of loyalties) {

                total += loyalty.value
                loyalty.total = total
                this.setTotal(cardId, total)
            }
        }


        this.lines.push(line)
    }


    fixLoyalty() {

        // copy over from toHtml()

        for (let line of this.lines) {
            switch (line.type) {
                case 'order':
                    let order = line.order

                    for (let card of this.cards) {

                    }



            }
        }



    }

    toHtml() {

        console.log(this)

        let reportTable = new HtmlTable()
        reportTable.class = 'orders'

        let orderHeaderCols: string[] = []
        reportTable.addRow(orderHeaderCols)

        orderHeaderCols.push('Afspraak', 'Totaal', 'Status', 'Betalingen', 'Info')

        for (let card of this.cards)
            orderHeaderCols.push(card.name)


        let commonEmpty = ['', '', '', '', '']

        for (let line of this.lines) {


            let lineCols: string[] = []
            reportTable.addRow(lineCols)

            switch (line.type) {

                case 'init':

                    lineCols.push(...commonEmpty)

                    for (let card of this.cards) {

                        let loyalties = line.getLoyaltyForCard(card.id)

                        if (ArrayHelper.NotEmpty(loyalties)) {
                            let loyaltyString = loyalties.map(l => l.value).join('<br>')
                            lineCols.push(loyaltyString)
                        } else {
                            lineCols.push('')
                        }
                    }

                    break

                case 'order':

                    let order = line.order

                    if (order) {


                        lineCols.push(order.startOrCreationDateFormat(), `${order.incl}`, `${order.state}`)

                        lineCols.push(order.sumToString(false))

                        if (order.hasPayments()) {
                            let payTable = new HtmlTable()
                            payTable.class = 'pays'

                            for (let pay of order.payments) {
                                let payCols: string[] = []
                                payTable.addRow(payCols)

                                payCols.push(`${pay.amount}`, pay.type)
                            }
                            lineCols.push(payTable.toHtmlString())
                        } else {
                            lineCols.push('')
                        }

                        for (let card of this.cards) {

                            let loyalties = order.getLoyaltyForCard(card.id)
                            let totalForCard = 0

                            if (ArrayHelper.NotEmpty(loyalties)) {

                                totalForCard = _.sumBy(loyalties, 'value')
                                let loyaltyString = loyalties.map(l => `${l.value > 0 ? '+' : ''}${l.value}=${l.total}`).join('<br>')
                                lineCols.push(loyaltyString)
                            } else {
                                lineCols.push('')
                            }

                            let expectedValue = 0

                            if (line.recalculated?.hasValue(card.programId)) {
                                expectedValue = line.recalculated.getValue(card.programId)

                                if (expectedValue != 0)
                                    if (expectedValue != totalForCard)
                                        lineCols.push(`<span style="color: red">${expectedValue}</span>`)
                                    else
                                        lineCols.push(`${expectedValue}`)
                                else
                                    lineCols.push('')
                            }


                        }
                    }

                    break

            }


        }

        let css = `<style>
.orders td { width: 10em; border: 1px solid black; vertical-align: top; text-align: end; }
.orders td:nth-child(4) { width: 20em; }


.pays td { width: 10em; border: 0px; }

.loyal td { width: 10em; border: 0px; }
</style>
`

        return css + reportTable.toHtmlString()




    }

}

export class CheckContactLoyalty {


    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {   // public branchId, 

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    /*     async checkContact(contactId: string): Promise<ContactLoyaltyReport> {
    
    
            let orders = await this.alteaDb.getOrdersForContact(contactId, ['payments', 'loyalty'], 200, 'cre', SortOrder.asc)  // , ['contact', 'payment']
    
            let loyaltyCards = await this.alteaDb.getLoyaltyCards(contactId, ['changes'])
    
    
            let report = new ContactLoyaltyReport(orders, loyaltyCards)
    
            return report
        } */

}