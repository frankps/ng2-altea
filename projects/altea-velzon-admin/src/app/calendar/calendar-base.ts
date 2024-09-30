import { OrderUi, PlanningType, Resource, ResourcePlanning, ResourcePlanningUi, ResourcePlannings } from "ts-altea-model"
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { OrderFireFilters, OrderFirestoreService, ResourcePlanningService, ResourceService, SessionService } from "ng-altea-common";
import { ArrayHelper, DbQueryTyped, QueryOperator } from "ts-common";
import { AlteaDb, AlteaPlanningQueries } from "ts-altea-logic";

export enum BaseEventType {
    ResourceSchedule,
    Order,
    OrderPlanning
}

/**
 *  A calendar implementation independent representation of an event
 * => can be re-used by any calendar implementation
 */
export class BaseEvent {
    id: string
    type: BaseEventType
    subject: string
    from: Date
    to: Date
    color: string

    contact: string
    resource: Resource

    static newEventBase(id: string, type: BaseEventType, subject: string, from: Date, to: Date, color: string) {
        const event = new BaseEvent()

        event.id = id
        event.type = type
        event.subject = subject
        event.from = from
        event.to = to
        event.color = color

        return event
    }

    static newResourceSchedule(resource: Resource, from: Date, to: Date) {
        const event = new BaseEvent()

        event.type = BaseEventType.ResourceSchedule
        event.resource = resource
        event.from = from
        event.to = to

        event.subject = resource?.name
        event.color = resource?.color

        return event
    }
}

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

    public startOfVisible: Date
    public endOfVisible: Date

    public events: object[] = []

    protected showHr = false
    protected showPlanning = true

    public filters: OrderFireFilters = new OrderFireFilters()


    unsubscribe: Unsubscribe

    constructor(protected sessionSvc: SessionService, protected orderFirestore: OrderFirestoreService, protected resourceSvc: ResourceService, protected alteaDb: AlteaDb) {

    }

    abstract refreshSchedule()

    abstract baseEventToEvent(eventBase: BaseEvent)
    /*
    abstract orderUiToEvent(orderUi: OrderUi)

    abstract planningUiToEvent(planningUi: ResourcePlanningUi)
*/

    toggleShowHr() {
        this.showHr = !this.showHr
        this.showEvents()
    }

    toggleShowPlanning() {
        this.showPlanning = !this.showPlanning
        this.showEvents()
    }

    baseEventsToEvents(baseEvents: BaseEvent[]) {

        if (ArrayHelper.IsEmpty(baseEvents))
            return []

        return baseEvents.map(baseEvent => this.baseEventToEvent(baseEvent))
    }

    /** -----------------   General  -------------------------- */
    /*  =========================================================== */


    async showWeekEvents(date: Date = new Date()) {

        const startOfVisible = dateFns.startOfWeek(date, { weekStartsOn: 1 })
        const endOfVisible = dateFns.endOfWeek(date, { weekStartsOn: 1 })

        await this.showEventsBetween(startOfVisible, endOfVisible)
    }

    async showEvents() {
        this.showEventsBetween(this.startOfVisible, this.endOfVisible)
    }

    async showEventsBetween(start: Date, end: Date) {

        this.startOfVisible = start
        this.endOfVisible = end

        this.events.splice(0, this.events.length)

        if (this.showHr) {

            const baseEvents = await this.getHrPlannings(start, end)

            if (ArrayHelper.NotEmpty(baseEvents))
                this.events.push(...this.baseEventsToEvents(baseEvents))

        }

        if (this.showPlanning) {
            this.showPlanningBetween(start, end)


        }

        this.refreshSchedule()


    }


    refreshEvents() {
        this.showEventsBetween(this.startOfVisible, this.endOfVisible)
    }

    /** -----------------   For HR view  -------------------------- */
    /*  =========================================================== */


    async getHrPlannings(start: Date, end: Date): Promise<BaseEvent[]> {

        var humanResources = await this.resourceSvc.getHumanResourcesInclGroups()
        humanResources = humanResources.filter(hr => !hr.isGroup && hr.online)


        var humanResourceIds = humanResources.map(hr => hr.id)


        var absencePlannings = await this.alteaDb.getPlanningsByTypes(humanResourceIds, start, end, AlteaPlanningQueries.absenceTypes(), this.sessionSvc.branchId)

        console.warn(humanResources)

        console.warn(absencePlannings)

        const allEvents: BaseEvent[] = []

        for (let humanResource of humanResources) {

            var defaultSchedule = humanResource.schedules.find(schedule => schedule.default)

            if (!defaultSchedule)
                continue

            var dateRangeSet = defaultSchedule.toDateRangeSet(start, end)
            dateRangeSet.resource = humanResource

            var absencesForResource = absencePlannings.filterByResource(humanResource.id).toDateRangeSet()

            if (!absencesForResource.isEmpty())
                dateRangeSet = dateRangeSet.subtract(absencesForResource)

            if (!dateRangeSet.isEmpty()) {

                const events = dateRangeSet.ranges.map(range => BaseEvent.newResourceSchedule(humanResource, range.from, range.to))
                allEvents.push(...events)
            }
        }

        return allEvents


    }



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

    orderUiToEventBase(orderUi: OrderUi): BaseEvent {

        return BaseEvent.newEventBase(orderUi.id, BaseEventType.Order, orderUi.shortInfo(), orderUi.startDate, orderUi.endDate, 'green')
    }

    /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
     *  Important: this.* will not work (because it's coming from callback context), instead use context.*
    */
    showOrderUis(context: CalendarBase, orderUis: OrderUi[]) {
        let events = []

        if (ArrayHelper.AtLeastOneItem(orderUis)) {
            console.warn(orderUis)


            const baseEvents = orderUis.map(orderUi => context.orderUiToEventBase(orderUi))
            events = baseEvents.map(baseEvent => context.baseEventToEvent(baseEvent))
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

        this.unsubscribe = await this.orderFirestore.getPlanningUisBetween(start, end, this.filters, this.showPlanningUis, this)
    }

    planningUiToEventBase(planningUi: ResourcePlanningUi): BaseEvent {

        const baseEvent = BaseEvent.newEventBase(planningUi.id, BaseEventType.OrderPlanning, planningUi.order?.shortInfo(), planningUi.startDate, planningUi.endDate, (planningUi.resource as Resource)?.color)
        //  baseEvent.contact = planningUi.
        return baseEvent
    }

    /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
     *  Important: this.* will not work (because it's coming from callback context), instead use context.*
    */
    showPlanningUis(context: CalendarBase, planningUis: ResourcePlanningUi[]) {
        let events = []

        if (ArrayHelper.AtLeastOneItem(planningUis)) {
            console.warn(planningUis)

            const baseEvents = planningUis.map(planningUi => context.planningUiToEventBase(planningUi))
            events = baseEvents.map(baseEvent => context.baseEventToEvent(baseEvent))

        }

        console.log(events)


        context.events.push(...events)

        context.refreshSchedule()
    }

}