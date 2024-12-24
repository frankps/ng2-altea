

//ending_before

import { DateHelper } from "ts-common"

export class StripeGetPayouts {

    /** get payouts earlier then */
    endingBefore?: string
    
}

export class StripePayout {
    id: string
    amount: number
    arrival_date: number

    get amountValue(): number {
        return this.amount / 100
    }

    get date(): Date {

        // https://stackoverflow.com/questions/4631928/convert-utc-epoch-to-local-date
        var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
        d.setUTCSeconds(this.arrival_date)
        return d

    }

    get dateNum(): Number {
        let date = this.date

        if (!date)
            return -1

        return DateHelper.yyyyMMdd(date)
    }
}