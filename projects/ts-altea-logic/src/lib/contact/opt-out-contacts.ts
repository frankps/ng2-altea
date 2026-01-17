import { AlteaDb, IDb } from "ts-altea-logic"
import { Contact, LoyaltyCard, LoyaltyCardChange, Order, Subscription } from "ts-altea-model"
import { ArrayHelper } from "ts-common"


export class OptOutContacts {
    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }

    async optOut(emails: string[]): Promise<Contact[]> {

        console.error(emails)

        let contacts = await this.alteaDb.getContactsByEmails(emails)

        if (ArrayHelper.IsEmpty(contacts))
            return []

        contacts.forEach(contact => {
            contact.optOut = true
        })

        let result = await this.alteaDb.updateContacts(contacts, ['optOut'])

        if (result.isOk)
            return result.data
        else
            return []

    }
}