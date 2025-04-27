import { ArrayHelper, ObjectHelper } from "ts-common"
import { LuxomState } from "./luxom-cmd"


export class LuxomAddress {

    constructor(public grp: string, public addr: string, public info?: string) { }

    static get spotsKelder(): LuxomAddress { return new LuxomAddress('1', '34', 'Spots kelder') }
    static get wandTrapInkom(): LuxomAddress { return new LuxomAddress('2', '12', 'Wand trap inkom') }
    static get gogglesTrapWellness(): LuxomAddress { return new LuxomAddress('2', '0C', 'Goggles trap wellness') }
    static get vloerTrapWellness(): LuxomAddress { return new LuxomAddress('1', '1A', 'Vloer trap wellness') }
    static get wellnessTL(): LuxomAddress { return new LuxomAddress('3', '00', 'Wellness TL') }
    static get zwembadTL(): LuxomAddress { return new LuxomAddress('2', '04', 'Zwembad TL') }
    static get zwembadLampen(): LuxomAddress { return new LuxomAddress('0', '0B', 'ZwembadLampen') }
    static get spotsJacuzzi(): LuxomAddress { return new LuxomAddress('2', '08', 'Spots jacuzzi') }
    static get spotsStraat(): LuxomAddress { return new LuxomAddress('2', '07', 'Spots straat') }
    static get jacuzziLamp(): LuxomAddress { return new LuxomAddress('0', 'OE', 'Jacuzzi lamp') }
    static get toiletWellness(): LuxomAddress { return new LuxomAddress('2', '0D', 'Toilet wellness') }
    static get jacuzziTL(): LuxomAddress { return new LuxomAddress('2', '06', 'Jacuzzi TL') }
    static get tuinTL(): LuxomAddress { return new LuxomAddress('2', '05', 'Tuin TL') }
    static get saunaStoombad(): LuxomAddress { return new LuxomAddress('5', '20', 'Sauna & Stoombad') }

    private static all: LuxomAddress[]

    static getAllAddresses() {

        if (ArrayHelper.IsEmpty(LuxomAddress.all))
            LuxomAddress.init()

        return this.all
    }

    static getAllAddressStates() {

        const addresses = this.getAllAddresses()

        return addresses.map(a => new LuxomState(undefined, a))
    }

    static init() {
        const all = LuxomAddress.all = []

        all.push(LuxomAddress.spotsKelder)
        all.push(LuxomAddress.wandTrapInkom)
        all.push(LuxomAddress.gogglesTrapWellness)
        all.push(LuxomAddress.vloerTrapWellness)
        all.push(LuxomAddress.wellnessTL)
        all.push(LuxomAddress.zwembadTL)
        all.push(LuxomAddress.zwembadLampen)
        all.push(LuxomAddress.spotsJacuzzi)
        all.push(LuxomAddress.spotsStraat)
        all.push(LuxomAddress.jacuzziLamp)
        all.push(LuxomAddress.toiletWellness)
        all.push(LuxomAddress.jacuzziTL)
        all.push(LuxomAddress.tuinTL)
        all.push(LuxomAddress.saunaStoombad)

        return all
    }

}