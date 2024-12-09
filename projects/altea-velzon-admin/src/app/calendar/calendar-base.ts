import { EventType, OrderUi, PlanningType, Resource, ResourcePlanning, ResourcePlanningUi, ResourcePlannings } from "ts-altea-model"
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { OrderFireFilters, OrderFirestoreService, ResourcePlanningService, ResourceService, SessionService } from "ng-altea-common";
import { ArrayHelper, DbQueryTyped, QueryOperator } from "ts-common";
import { AlteaDb, AlteaPlanningQueries } from "ts-altea-logic";
import * as _ from "lodash";
import {Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout} from 'async-mutex';

export enum BaseEventType {
    ResourceSchedule,
    Order,
    OrderPlanning,
    Task
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

    order: OrderUi

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

    static newResourceSchedule(resource: Resource, from: Date, to: Date, tag: any) {
        const event = new BaseEvent()

        event.type = BaseEventType.ResourceSchedule
        event.resource = resource
        event.from = from
        event.to = to

        event.subject = resource?.name

        if (tag)
            event.subject += ' ' + tag

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

    mutex = new Mutex();

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

            const events = this.baseEventsToEvents(baseEvents)

            await this.updateEvents(BaseEventType.ResourceSchedule, events)

            /*
            if (ArrayHelper.NotEmpty(baseEvents))
                this.events.push(...this.baseEventsToEvents(baseEvents))
*/
        }

        if (this.showPlanning) {
            await this.showPlanningBetween(start, end)


        }

        this.refreshSchedule()


    }


    refreshEvents() {
        this.showEventsBetween(this.startOfVisible, this.endOfVisible)
    }

    /** -----------------   For HR view  -------------------------- */
    /*  =========================================================== */


    async getHrPlannings(start: Date, end: Date): Promise<BaseEvent[]> {

        let branchId = this.sessionSvc.branchId

        var humanResources = await this.resourceSvc.getHumanResourcesInclGroups()
        humanResources = humanResources.filter(hr => !hr.isGroup && hr.online)

        var humanResourceIds = humanResources.map(hr => hr.id)

        var getResourceIds = [ ...humanResourceIds, branchId]

        var extraPlannings = await this.alteaDb.getPlanningsByTypes(getResourceIds, start, end, AlteaPlanningQueries.extraTypes(), branchId)


        var absencePlannings = extraPlannings.filterByType(...AlteaPlanningQueries.absenceTypes())
        var availablePlannings = extraPlannings.filterByType(...AlteaPlanningQueries.availableTypes())

        var specialPlannings = extraPlannings.filterByType(PlanningType.edu)

        console.warn(humanResources)

        console.warn(absencePlannings)

        const allEvents: BaseEvent[] = []


        var branchClosed = absencePlannings.filterByResource(branchId).toDateRangeSet()


        for (let humanResource of humanResources) {

            var defaultSchedule = humanResource.schedules.find(schedule => schedule.default)

            if (!defaultSchedule)
                continue

            var dateRangeSet = defaultSchedule.toDateRangeSet(start, end)
            dateRangeSet.resource = humanResource

            var absencesForResource = absencePlannings.filterByResource(humanResource.id).toDateRangeSet()
            var extraAvailableForResource = availablePlannings.filterByResource(humanResource.id).toDateRangeSet()

             if (!extraAvailableForResource.isEmpty()) {
                dateRangeSet = dateRangeSet.add(extraAvailableForResource) 

                console.warn('EXTRA AVAILABLE')
                console.error(dateRangeSet)
             }

            if (!absencesForResource.isEmpty())
                dateRangeSet = dateRangeSet.subtract(absencesForResource)

            dateRangeSet = dateRangeSet.subtract(branchClosed)

            if (!dateRangeSet.isEmpty()) {

                dateRangeSet = dateRangeSet.union()

                if (specialPlannings.notEmpty()) {
                    var special = specialPlannings.filterByResource(humanResource.id).toDateRangeSet()
                    console.warn('SPECIAL ---> ', special)
                    dateRangeSet = dateRangeSet.add(special)
                }


                const events = dateRangeSet.ranges.map(range => BaseEvent.newResourceSchedule(humanResource, range.from, range.to, range.tag))


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


        context.updateEvents(BaseEventType.Order, events)

        /*
        if (!context.events)
            context.events = []
        else
            context.events.splice(0, context.events.length)

        context.events.push(...events)
*/

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


        console.log(`showPlanningBetween ${start}-${end}`)

        if (this.unsubscribe)  // we unsubscribe from previous changes
            this.unsubscribe()

        this.unsubscribe = await this.orderFirestore.getPlanningUisBetween(start, end, this.filters, this.showPlanningUis, this)
    }

    planningUiToEventBase(planningUi: ResourcePlanningUi): BaseEvent {

        const baseEvent = BaseEvent.newEventBase(planningUi.id, BaseEventType.OrderPlanning, planningUi.order?.shortInfo(), planningUi.startDate, planningUi.endDate, (planningUi.resource as Resource)?.color)

        baseEvent.order = planningUi.order

        //  baseEvent.contact = planningUi.
        return baseEvent
    }


    /**
     * this.events contains all events for different sets of data (defined by event.type: BaseEventType)
     * When firestore gives updates for new plannings/orders we only need to replace this type of events 
     * 
     * @param eventType 
     * @param events 
     */
    async updateEvents(eventType: BaseEventType, events: any[]) {

        await this.mutex.runExclusive(async () => {

            console.warn('updateEvents', eventType, events)

            if (!this.events)
                this.events = []
            else {
    
                
                // remove events of type eventType
                const toRemove = []
                for (let i = this.events.length-1; i >= 0 ; i--) {
                    if (this.events[i]['type'] === eventType) 
                        toRemove.push(i)
                }

                for (let idx of toRemove)
                    this.events.splice(idx, 1)

            }
    
            this.events.push(...events)
            
        });


    }


    /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
     *  Important: this.* will not work (because it's coming from callback context), instead use context.*
    */
    async showPlanningUis(context: CalendarBase, planningUis: ResourcePlanningUi[]) {
        let events = []

        if (ArrayHelper.AtLeastOneItem(planningUis)) {
            console.warn(planningUis)

            const baseEvents = planningUis.map(planningUi => context.planningUiToEventBase(planningUi))
            events = baseEvents.map(baseEvent => context.baseEventToEvent(baseEvent))

        }

        console.log(events)

        await context.updateEvents(BaseEventType.OrderPlanning, events)

        console.log(context.events)

        context.refreshSchedule()
    }

}