import { LoyaltyCard, LoyaltyProgram, Order, OrderLine, Product, ProductSubType, ProductType } from "ts-altea-model";
import { AlteaDb } from "../general/altea-db";
import { ArrayHelper } from "ts-common";
import { IDb } from "../interfaces/i-db";


/** to show loyalty card info in the UI */
export class LoyaltyCardUi {

    program: LoyaltyProgram
    card: LoyaltyCard

    current: number = 0

    /** the extra (loyalty) amount that can be put on the card  */
    extra: number = 0

    constructor(program: LoyaltyProgram, card: LoyaltyCard) {
        this.program = program
        this.card = card
    }
}

export class LoyaltyByProgram {

    msg?: string
    values = new Map<string, number>()
    programs: LoyaltyProgram[]

    addLoyalty(programId: string, value: number): number {

        let newValue = value

        if (this.values.has(programId))
            newValue += this.values.get(programId)

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

export class LoyaltyCalculator {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async getOverview(order: Order): Promise<LoyaltyCardUi[]> {

        const result = await this.calculateLoyalty(order)

        let cards: LoyaltyCard[] = []

        if (order?.contact?.cards)
            cards = order.contact.cards

        if (!result || !result.hasValues())
            return []

        const uiCards = []

        for (let loyaltyProgram of result.programs) {


            const existingCard = cards.find(c => c.programId == loyaltyProgram.id)

            const uiCard = new LoyaltyCardUi(loyaltyProgram, existingCard)
            uiCards.push(uiCard)

            uiCard.extra =  result.getValue(loyaltyProgram.id)

            if (existingCard)
                uiCard.current = existingCard.value

        }


        return uiCards

    }



    async calculateLoyalty(order: Order): Promise<LoyaltyByProgram> {

        const result = new LoyaltyByProgram()

        if (!order.hasLines())
            return result

        var loyaltyPrograms = await this.alteaDb.getLoyaltyPrograms(order.branchId)

        if (ArrayHelper.IsEmpty(loyaltyPrograms)) {
            result.msg = `No loyalty programs found for branch ${order.branchId}!`
            return result
        }

        result.programs = loyaltyPrograms

        for (var line of order.lines) {

            if (!line.product)
                continue

            for (let loyaltyProgram of loyaltyPrograms) {

                if (loyaltyProgram.hasProduct(line.product)) {
                    result.addLoyalty(loyaltyProgram.id, line.incl)
                    break  // every orderline can only be allocated to 1 loyalty program 
                }


            }
        }

        return result
    }






}