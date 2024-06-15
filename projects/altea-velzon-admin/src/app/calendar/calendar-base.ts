import { OrderUi, Resource, ResourcePlanningUi } from "ts-altea-model"
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { OrderFirestoreService } from "ng-altea-common";
import { ArrayHelper } from "ts-common";

export abstract class CalendarBase {   // <T extends CalendarBase<any>>

    public data: object[] = [];


    constructor(protected orderFirestore: OrderFirestoreService,) {

    }

    abstract refreshSchedule() 
    
    /*{
        console.log('test')

    }*/

    unsubscribe: Unsubscribe

    /** ----------------- For order view -------------------------- */
    /*  =========================================================== */

    static orderUiToEvent(orderUi: OrderUi) {

        return {
            Id: orderUi.id,
            Subject: orderUi.shortInfo(),
            StartTime: orderUi.startDate,
            EndTime: orderUi.endDate,
            CategoryColor: 'green'
        }

    }

    async showOrderWeek(date: Date = new Date()) {

        const startOfVisible = dateFns.startOfWeek(date)
        const endOfVisible = dateFns.endOfWeek(date)

        await this.showOrdersBetween(startOfVisible, endOfVisible)
    }



    async showOrdersBetween(start: Date, end: Date) {

        if (this.unsubscribe)  // we unsubscribe from previous changes
            this.unsubscribe()

        this.unsubscribe = await this.orderFirestore.getOrderUisBetween(start, end, this.showOrderUis, this)

    }

    /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
     *  Important: this.* will not work (because it's coming from callback context), instead use context.*
    */
    showOrderUis(context: CalendarBase, orderUis: OrderUi[]) {
        let events = []

        if (ArrayHelper.AtLeastOneItem(orderUis)) {
            console.warn(orderUis)
            events = orderUis.map(orderUi => CalendarBase.orderUiToEvent(orderUi))
        }

        console.log(events)

        context.data.splice(0, context.data.length)
        context.data.push(...events)

        this.refreshSchedule()
    }

    /** ----------------- For planning view ----------------------- */
    /*  =========================================================== */

    planningUiToEvent(planningUi: ResourcePlanningUi) {

        return {
            Id: planningUi.id,
            Subject: planningUi.order?.shortInfo(),
            StartTime: planningUi.startDate,
            EndTime: planningUi.endDate,
            CategoryColor: (planningUi.resource as Resource)?.color
        }

    }


    async showPlanningWeek(date: Date = new Date()) {

        const startOfVisible = dateFns.startOfWeek(date)
        const endOfVisible = dateFns.endOfWeek(date)

        await this.showPlanningBetween(startOfVisible, endOfVisible)
    }


    async showPlanningBetween(start: Date, end: Date) {

        if (this.unsubscribe)  // we unsubscribe from previous changes
            this.unsubscribe()

        this.unsubscribe = await this.orderFirestore.getPlanningUisBetween(start, end, this.showPlanningUis, this)

    }

    /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
     *  Important: this.* will not work (because it's coming from callback context), instead use context.*
    */
    showPlanningUis(context: CalendarBase, planningUis: ResourcePlanningUi[]) {
        let events = []

        if (ArrayHelper.AtLeastOneItem(planningUis)) {
            console.warn(planningUis)
            events = planningUis.map(planningUi => context.planningUiToEvent(planningUi))
        }

        console.log(events)

        context.data.splice(0, context.data.length)
        context.data.push(...events)

        context.refreshSchedule()
    }

}