import { ArrayHelper } from "ts-common"
import { ActionArgs } from "./action"
import { LuxomAddress } from "./luxom-address"
import { Type } from "class-transformer"

export class LuxomGetState extends ActionArgs {

    @Type(() => LuxomAddress)
    addrs: LuxomAddress[]

    constructor(addrs: LuxomAddress[]) {
        super()

        this.addrs = addrs

    }

    stringCommand(): string {

        if (ArrayHelper.IsEmpty(this.addrs))
            return undefined

        const cmds = []

        for (let addr of this.addrs) {

            let cmd = `*P,0,${addr.grp},${addr.addr};`
            cmds.push(cmd)
        }

        const cmd = cmds.join('')

        return cmd
    }

}

/**
 * Luxom Command
 */
export class LuxomState extends ActionArgs {
    /**
     * 
     * @param cmd (T)oggle or (S)et or (C)lear or (A)=Set Hexadecimal Value
     * @param grp the Luxom group
     * @param addr Luxom address
     * @param hex hexa decimal value (in case of dimming)
     */
    constructor(public cmd: 'T' | 'S' | 'C' | 'A' | undefined, public addr: LuxomAddress, public hex?: string, public tag?: string) {
        super()

    }

    style() {

        switch (this.cmd) {
            case 'S':
                return 'success'
            case 'C':
                return 'danger'
            case 'A':
                if (this.getPct() > 0)
                    return 'warning'
        }
        return 'light'
    }

    static set(luxAddr: LuxomAddress): LuxomState {
        return new LuxomState('S', luxAddr)
    }

    static clear(luxAddr: LuxomAddress): LuxomState {
        return new LuxomState('C', luxAddr)
    }

    static toggle(luxAddr: LuxomAddress, tag?: string): LuxomState {
        return new LuxomState('T', luxAddr, undefined, tag)
    }

    static setHex(luxAddr: LuxomAddress, hex: string): LuxomState {
        return new LuxomState('A', luxAddr, hex)
    }

    static setPctg(luxAddr: LuxomAddress, pctg: string): LuxomState {
        const temp = +pctg / 100 * 255
        let hex = temp.toString(16)

        let decimalIndex = hex.indexOf('.')

        if (decimalIndex > -1) {
            hex = hex.substring(0, decimalIndex)
            hex = hex.toUpperCase()
        }

        return this.setHex(luxAddr, hex)
    }



    getPct(): number {

        if (!this.hex)
            return 0

        return parseInt(this.hex, 16)

    }

    /*
    .NET code    Pct > Hex
      string hexValue = ((int) (double.Parse(percentage) / 100.0 * (double) byte.MaxValue)).ToString("X");
      luxomSvcClient.SetHex(new LuxomAddress(luxomGroup, luxomAddress), hexValue);
    */

      stringCommand(): string {
        let suffix = ''

        if (this.cmd == 'A' && this.hex) {
            let hex = this.hex.padStart(3, '0')
            suffix = `*Z,${hex};`
        }
            

        let cmd = `*${this.cmd},0,${this.addr.grp},${this.addr.addr};${suffix}`

        return cmd
    }



    stringCommandOrig(): string {
        let suffix = ''

        if (this.cmd == 'A' && this.hex)
            suffix = `*Z,{args.hex};`

        let cmd = `*${this.cmd},0,${this.addr.grp},${this.addr.addr};${suffix}`

        return cmd
    }


}