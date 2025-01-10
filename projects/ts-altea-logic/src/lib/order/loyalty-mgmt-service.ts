import { LoyaltyCard, LoyaltyCardChange, LoyaltyLine, LoyaltyProgram, LoyaltyReward, LoyaltyUnit, Order, OrderLine, Payment, PaymentType, Product, ProductSubType, ProductType, RegisterLoyalty } from "ts-altea-model";
import { AlteaDb } from "../general/altea-db";
import { ArrayHelper } from "ts-common";
import { IDb } from "../interfaces/i-db";
import * as _ from "lodash";



export class LoyaltyUi {

    cards: LoyaltyUiCard[] = []

    programs: LoyaltyProgram[] = []

    /** true if there is new loyalty */
    newLoyalty = false

    constructor(public order: Order) {

    }

    hasCards(): boolean {
        return ArrayHelper.NotEmpty(this.cards)
    }

    getApiObject(): RegisterLoyalty {

        const register = new RegisterLoyalty(this.order)

        if (ArrayHelper.IsEmpty(this.cards))
            return register

        register.lines = this.cards.filter(c => c.extra > 0).map(uiCard => new LoyaltyLine(uiCard.program.id, uiCard.program.name, uiCard.extra))

        return register
    }


    update(cards: LoyaltyCard[], resetExtra = true) {

        if (ArrayHelper.IsEmpty(cards))
            return

        for (let card of cards) {

            const uiCard = this.cards.find(c => c.program.id == card.programId)

            if (uiCard) {
                uiCard.current = card.value

                if (resetExtra)
                    uiCard.extra = 0
            }
        }
    }

    availableRewards(): LoyaltyReward[] {

        if (ArrayHelper.IsEmpty(this.cards))
            return []

        const rewards = this.cards.flatMap(c => c.openRewards)
        return rewards
    }

}

/** to show loyalty card info in the UI */
export class LoyaltyUiCard {

    program: LoyaltyProgram
    card: LoyaltyCard

    current: number = 0

    /** the extra (loyalty) amount that can be put on the card  */
    extra: number = 0

    /** the rewards that are currently available */
    openRewards: LoyaltyReward[]

    constructor(program: LoyaltyProgram, card: LoyaltyCard) {
        this.program = program
        this.card = card
    }

    hasOpenRewards(): boolean {
        return ArrayHelper.AtLeastOneItem(this.openRewards)
    }

}

export class LoyaltyByProgram {

    msg?: string
    values = new Map<string, number>()
    programs: LoyaltyProgram[]

    setPrograms(programs: LoyaltyProgram[]) {

        this.programs = programs
        this.values = new Map<string, number>()

        if (ArrayHelper.IsEmpty(programs))
            return

        for (let program of this.programs) {
            this.values.set(program.id, 0)
        }
    }


    addLoyalty(programId: string, value: number): number {

        let newValue = value

        if (this.values.has(programId))
            newValue += this.values.get(programId)

        newValue = _.round(newValue, 2)

        this.values.set(programId, newValue)

        return newValue
    }


    hasValues(): boolean {
        return this.values && this.values.size > 0
    }

    getValue(programId: string): number {

        if (!this.values.has(programId))
            return 0

        return this.values.get(programId)

    }

}

export class LoyaltyMgmtService {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }



    async saveLoyalty(register: RegisterLoyalty): Promise<LoyaltyCard[]> {

        const existingCards: LoyaltyCard[] = await this.alteaDb.getLoyaltyCards(register.order.contactId)
        let existingProgramIds: string[] = []

        existingProgramIds = existingCards.map(card => card.programId)

        const cardChanges: LoyaltyCardChange[] = []


        if (ArrayHelper.AtLeastOneItem(existingCards)) {

            const cardsToUpdate: LoyaltyCard[] = []

            const lines = register.getLinesForPrograms(existingProgramIds)

            for (let line of lines) {

                const card = existingCards.find(c => c.programId == line.programId)
                card.value += line.extra

                cardChanges.push(LoyaltyCardChange.newValue(register.order.id, card.id, line.extra))

                cardsToUpdate.push(card)
            }

            if (cardsToUpdate.length > 0) {
                const updateResult = await this.alteaDb.updateLoyaltyCards(cardsToUpdate, ['value'])
                console.log(updateResult)
            }


        }

        const cardsToCreate: LoyaltyCard[] = []

        // non existing cards for customer/contact
        const newCardLines = register.getLinesForOtherPrograms(existingProgramIds)

        for (let line of newCardLines) {

            const newCard = new LoyaltyCard()
            newCard.contactId = register.order.contactId
            newCard.programId = line.programId
            newCard.name = line.name  // the program name
            newCard.value = line.extra

            cardChanges.push(LoyaltyCardChange.newValue(register.order.id, newCard.id, line.extra))

            cardsToCreate.push(newCard)
        }

        if (cardsToCreate.length > 0) {
            const createResult = await this.alteaDb.createLoyaltyCards(cardsToCreate)
            console.log(createResult)
        }

        if (cardChanges.length > 0) {
            const cardChangesResult = await this.alteaDb.createLoyaltyCardChanges(cardChanges)
            console.log(cardChanges)
        }

        let order = register.order
        order.loyal = true
        //order.markAsUpdated('loyal')

        const updateOrderResult = await this.alteaDb.updateOrder(order, ['loyal'])
        console.log(updateOrderResult)

        return [...existingCards, ...cardsToCreate]
    }

    async getOverview(order: Order): Promise<LoyaltyUi> {

        console.error('-- getOverview --')

        const newLoyaltyThisOrder = await this.calculateLoyalty(order)

        if (!newLoyaltyThisOrder)
            return null

        const loyalty = new LoyaltyUi(order)

        loyalty.programs = newLoyaltyThisOrder.programs
        let cards: LoyaltyCard[] = []

        if (order?.contact?.cards)
            cards = order.contact.cards

        if (!newLoyaltyThisOrder || !newLoyaltyThisOrder.hasValues())
            return loyalty

        //  const uiCards = []

        for (let loyaltyProgram of newLoyaltyThisOrder.programs) {

            const existingCard = cards.find(c => c.programId == loyaltyProgram.id)

            const uiCard = new LoyaltyUiCard(loyaltyProgram, existingCard)
            loyalty.cards.push(uiCard)

            // the extra amount that can be added coming from this order
            uiCard.extra = newLoyaltyThisOrder.getValue(loyaltyProgram.id)

            if (uiCard.extra > 0)
                loyalty.newLoyalty = true

            if (existingCard) {

                uiCard.current = existingCard.value

                if (existingCard.value > 0 && loyaltyProgram.hasRewards()) {
                    uiCard.openRewards = loyaltyProgram.rewards.filter(r => r.amount <= existingCard.value)
                }



            }


        }


        return loyalty

    }



    /** Calculates new loyalty points per program */
    async calculateLoyalty(order: Order): Promise<LoyaltyByProgram> {

        const result = new LoyaltyByProgram()

        /*
        if (!order.allPaid()) {
            result.msg = `Order not fully paid!`
            return result
        }*/

        if (order.loyal) {
            result.msg = `Loyalty already applied!`
            return result
        }

        var loyaltyPrograms = await this.alteaDb.getLoyaltyPrograms(order.branchId)

        if (ArrayHelper.IsEmpty(loyaltyPrograms)) {
            result.msg = `No loyalty programs found for branch ${order.branchId}!`
            return result
        }

        result.setPrograms(loyaltyPrograms)

        if (!order.hasLines())
            return result


        var validLoyaltyPays = order.getPaymentsNotOfTypes(PaymentType.loyal, PaymentType.gift, PaymentType.subs)

        if (!validLoyaltyPays)
            validLoyaltyPays = []

        var validTotal = _.sumBy(validLoyaltyPays, 'amount')

        if (validTotal == 0) {
            result.msg = `No payments that cause loyalty`
            return result
        }

        for (var line of order.lines) {

            if (!line.product)
                continue

            for (let loyaltyProgram of loyaltyPrograms) {

                if (loyaltyProgram.hasProduct(line.product)) {

                    switch (loyaltyProgram.track) {
                        case LoyaltyUnit.qty:
                            if (validTotal >= line.incl) {
                                validTotal -= line.incl
                                result.addLoyalty(loyaltyProgram.id, line.qty)
                            }
                            
                            break
                        default: {
                            let extraLoyalty = Math.min(validTotal, line.incl)
                            extraLoyalty = _.round(extraLoyalty, 2)
                            validTotal -= extraLoyalty
                            result.addLoyalty(loyaltyProgram.id, extraLoyalty)
                            break
                        }
                    }


                    break  // every orderline can only be allocated to 1 loyalty program 
                }

                if (validTotal <= 0)
                    break


            }
        }


        // if there are loyalty payments (used loyalty), then this should NOT cause new loyalty
        /*
        var nonLoyaltyPays = order.getPaymentsByTypes(PaymentType.loyal, PaymentType.gift, PaymentType.subs)

        if (ArrayHelper.NotEmpty(nonLoyaltyPays)) {
            
            for (let pay of nonLoyaltyPays) {

                // check if qty based loyalty !!!
                result.addLoyalty(pay.loyalId, -pay.amount)
            }
        }
        */


        return result
    }






}