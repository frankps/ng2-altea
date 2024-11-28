import { AlteaDb, IDb } from "ts-altea-logic"
import { LoyaltyCard, LoyaltyCardChange } from "ts-altea-model"
import { ArrayHelper } from "ts-common"


export class MoveContactData {
    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async move(fromContactId: string, toContactId: string) {

        console.log(`Move ${fromContactId} to ${toContactId}`)
        await this.moveLoyalty(fromContactId, toContactId)

    }

    async moveLoyalty(fromContactId: string, toContactId: string) {

        var loyaltyCardsFrom: LoyaltyCard[] = await this.alteaDb.getLoyaltyCards(fromContactId)

        if (ArrayHelper.IsEmpty(loyaltyCardsFrom))
            return

        var loyaltyCardsTo: LoyaltyCard[] = await this.alteaDb.getLoyaltyCards(toContactId)

        const newCards: LoyaltyCard[] = []
        const updatedCards: LoyaltyCard[] = []
        const loyaltyCardChanges: LoyaltyCardChange[] = []

        if (ArrayHelper.IsEmpty(loyaltyCardsTo))
            loyaltyCardsTo = []  // to be sure it is not null


        for (let loyaltyCardFrom of loyaltyCardsFrom) {

            if (loyaltyCardFrom.value == 0)
                continue

            let loyaltyCardTo = loyaltyCardsTo.find(c => c.programId == loyaltyCardFrom.programId)

            if (!loyaltyCardTo) {
                loyaltyCardTo = LoyaltyCard.new(toContactId, loyaltyCardFrom.programId, loyaltyCardFrom.name)
                newCards.push(loyaltyCardTo)
            } else
                updatedCards.push(loyaltyCardTo)

            updatedCards.push(loyaltyCardFrom)

            const valueToMove = loyaltyCardFrom.value

            loyaltyCardTo.value += valueToMove
            loyaltyCardFrom.value = 0

            let loyaltyCardFromChange = LoyaltyCardChange.newValue(null, loyaltyCardFrom.id, -valueToMove, `Moved to contact ${toContactId}`)
            loyaltyCardChanges.push(loyaltyCardFromChange)
            let loyaltyCardToChange = LoyaltyCardChange.newValue(null, loyaltyCardTo.id, valueToMove, `Moved from contact ${fromContactId}`)
            loyaltyCardChanges.push(loyaltyCardToChange)

        }

        if (ArrayHelper.NotEmpty(updatedCards)) {
            await this.alteaDb.updateLoyaltyCards(updatedCards, ['value'])
        }

        if (ArrayHelper.NotEmpty(newCards)) {
            await this.alteaDb.createLoyaltyCards(newCards)
        }

        if (ArrayHelper.NotEmpty(loyaltyCardChanges)) {
            await this.alteaDb.createLoyaltyCardChanges(loyaltyCardChanges)
        }


    }
}

/*


    */