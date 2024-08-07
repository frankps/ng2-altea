import { ActionType } from "./action";
import { Script } from "./script";
import { LuxomAddress } from "./luxom-address";
import { LuxomState } from "./luxom-cmd";
import { ArrayHelper } from "ts-common";


export class ScriptRepository {

    private static all: Script[]


    static init() {
        const all : Script[] = ScriptRepository.all = []

        all.push(ScriptRepository.wellness_start_min15)
        all.push(ScriptRepository.wellness_start_min4)
        all.push(ScriptRepository.wellness_start_min2)
        all.push(ScriptRepository.wellness_end_min10)
        all.push(ScriptRepository.wellness_end_plus2)
       
        return all
    }

    static getById(scriptId: string): Script {

        if (ArrayHelper.IsEmpty(ScriptRepository.all))
            ScriptRepository.init()

        const script = ScriptRepository.all.find(s => s.id == scriptId)

        return script
    }



    static get wellness_start_min15(): Script {
        const script = new Script("Wellness Start -15", "wellness_start_min15")

       // -15 mins
       script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.spotsKelder))
       script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.wandTrapInkom))
       script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.gogglesTrapWellness, "25"))
       script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.vloerTrapWellness))

        return script
    }

    static get wellness_start_min4(): Script {
        const script = new Script("Wellness Start -4", "wellness_start_min4")

        // -4
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.zwembadTL, "15"))
        script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.zwembadLampen))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.spotsJacuzzi, "40"))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.spotsStraat, "40"))
        script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.jacuzziLamp))
        script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.toiletWellness))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.jacuzziTL, "0"))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.tuinTL, "0"))
        
        return script
    }

    static get wellness_start_min2(): Script {
        const script = new Script("Wellness Start -2", "wellness_start_min2")

        // -2
        script.addAction(ActionType.luxom, LuxomState.toggle(LuxomAddress.saunaStoombad))

        return script
    }


    static get wellness_end_min10(): Script {
        const script = new Script("Wellness End -10", "wellness_end_min10")

        // -10 mins
        script.addAction(ActionType.luxom, LuxomState.set(LuxomAddress.wandTrapInkom))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.jacuzziTL, "40"))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.tuinTL, "40"))
        script.addAction(ActionType.luxom, LuxomState.setPctg(LuxomAddress.zwembadTL, "30"))

        return script
    }


    static get wellness_end_plus2(): Script {
        const script = new Script("Wellness End +2", "wellness_end_plus2")

        // 2 mins
        script.addAction(ActionType.luxom, LuxomState.clear(LuxomAddress.spotsJacuzzi))
        script.addAction(ActionType.luxom, LuxomState.clear(LuxomAddress.spotsStraat))
        script.addAction(ActionType.luxom, LuxomState.toggle(LuxomAddress.saunaStoombad))
        script.addAction(ActionType.luxom, LuxomState.clear(LuxomAddress.zwembadLampen))
        script.addAction(ActionType.luxom, LuxomState.clear(LuxomAddress.jacuzziLamp))

        return script
    }



}