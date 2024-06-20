import { OrderUi, Resource, ResourcePlanningUi } from "ts-altea-model"
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { OrderFirestoreService } from "ng-altea-common";
import { ArrayHelper } from "ts-common";


/**
 *  We want to separate calendar specific functionality (by specific providers: full calendar/syncfusion)
 *  from general functionality (fetching data from back-end)
 * 
 *  A calendar can show:
 *    orders
 * 
 *    resource plannings 
 */
export abstract class CalendarBase { 

    public events: object[] = []

    unsubscribe: Unsubscribe

    constructor(protected orderFirestore: OrderFirestoreService,) {
    }

    abstract refreshSchedule() 
    
    abstract orderUiToEvent(orderUi: OrderUi) 

    abstract planningUiToEvent(planningUi: ResourcePlanningUi)


    

    /** ----------------- For order view -------------------------- */
    /*  =========================================================== */



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
            events = orderUis.map(orderUi => context.orderUiToEvent(orderUi))
        }

        console.log(events)

        context.events.splice(0, context.events.length)
        context.events.push(...events)

        this.refreshSchedule()
    }

    /** ----------------- For planning view ----------------------- */
    /*  =========================================================== */

    async showPlanningDay(date: Date = new Date()) {

        const startOfVisible = dateFns.startOfDay(date)
        const endOfVisible = dateFns.endOfDay(date)

        await this.showPlanningBetween(startOfVisible, endOfVisible)
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

        context.events.splice(0, context.events.length)
        context.events.push(...events)

        context.refreshSchedule()
    }

}