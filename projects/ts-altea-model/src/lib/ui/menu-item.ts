import { Contact } from "ts-altea-model"
import { ArrayHelper } from "ts-common"



export class MenuItem {

    roles: string[] = []
    hasRoles = false

    constructor(public code: string, public show: 'loggedOn' | 'loggedOff' | 'always', ...roles: string[]) {

        if (ArrayHelper.NotEmpty(roles)) {
            this.roles = roles
            this.hasRoles = true
        }

    }

    /**
     * Quickly developed to hide certain items during go-live
     * @param contact 
     * @returns 
     */
    contactAllowed(contact: Contact) {

        return contact?.email == "frank@dvit.eu"
    }

    showLoggedOn(contact: Contact) {
        return this.show == 'loggedOn' && (!this.hasRoles || this.contactAllowed(contact))
    }

    showLoggedOff(contact: Contact) {
        return this.show == 'loggedOff' && (!this.hasRoles || this.contactAllowed(contact))
    }

    showAlways(contact: Contact) {
        return this.show == 'always' && (!this.hasRoles || this.contactAllowed(contact))
    }
}