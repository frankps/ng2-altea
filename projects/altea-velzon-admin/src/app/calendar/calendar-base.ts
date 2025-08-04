import { EventType, OrderUi, PlanningType, Resource, ResourcePlanning, ResourcePlanningUi, ResourcePlannings, Schedule } from "ts-altea-model"
import * as dateFns from 'date-fns'
import { Unsubscribe } from 'firebase/firestore';
import { OrderFireFilters, OrderFirestoreService, ResourcePlanningService, ResourceService, SessionService } from "ng-altea-common";
import { ArrayHelper, DateHelper, DbQueryTyped, QueryOperator } from "ts-common";
import { AlteaDb, AlteaPlanningQueries } from "ts-altea-logic";
import * as _ from "lodash";
import { Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout } from 'async-mutex';

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

    vouchers: string[]

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

    vouchersToString() {
        if (ArrayHelper.IsEmpty(this.vouchers))
            return ''

        return this.vouchers.join(' ')
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



    /**
     * When managers are not on-site (HiFr afwezig), then we preconfigure masks for the cleaning blocks
     * convert these mask resource plannings in base events
     *  
     * @param extraPlannings 
     * @returns 
     */
    async doMasks(extraPlannings: ResourcePlannings): Promise<BaseEvent[]> {

        var masks = extraPlannings.filterByType(PlanningType.mask)

        const maskEvents: BaseEvent[] = []

        if (masks.notEmpty()) {

            var groupIds = masks.plannings.map(mask => mask.resourceGroupId).filter(id => id != null && id != undefined)
            groupIds = _.uniq(groupIds)

            if (ArrayHelper.NotEmpty(groupIds)) {

                var groupResources = await this.resourceSvc.getMany$(groupIds)

                for (let groupResource of groupResources) {

                    var groupMasks = masks.filterByResource(groupResource.id, true)

                    var dateRangeSet = groupMasks.toDateRangeSet()

                    const events = dateRangeSet.ranges.map(range => BaseEvent.newResourceSchedule(groupResource, range.from, range.to, range.tag))

                    maskEvents.push(...events)
                }

            }
        }

        return maskEvents

    }


    /**
     * Groups an array of objects by multiple properties (including nested ones) and counts items in each group
     * @param array The array of objects to group
     * @param keys The property names to group by (can include dot notation for nested properties)
     * @returns A map where keys are JSON stringified arrays of property values and values are counts
     */
    groupByAndCount<T>(array: T[], keys: string[]): Map<string, number> {
        // Using Map instead of object to allow arrays as keys
        const groupMap = new Map<string, number>();

        for (const item of array) {
            // Create array of values for the specified properties, handling nested properties
            const groupValues = keys.map(key => {
                if (key.includes('.')) {
                    const [parentKey, childKey] = key.split('.');
                    // Need to check if parentKey exists and is an object
                    const parent = item[parentKey as keyof T];
                    if (parent && typeof parent === 'object') {
                        return parent[childKey as keyof typeof parent];

                    }
                    return undefined; // Handle case when parent doesn't exist or isn't an object
                } else {
                    return item[key as keyof T];
                }
            });

            // Convert to string for use as Map key
            const groupKey = JSON.stringify(groupValues);

            // Increment the count for this group
            groupMap.set(groupKey, (groupMap.get(groupKey) || 0) + 1);
        }

        return groupMap;
    }


    uniqEvents(events: BaseEvent[]) {

        if (ArrayHelper.IsEmpty(events))
            return

        let me = this

        const groupedByDeptAndRole = me.groupByAndCount(events, ['ResourceId', 'StartTimeNum']);

        // To display the results in a readable format:
        for (const [key, count] of groupedByDeptAndRole.entries()) {

            if (count <= 1)
                continue

            const keyValues = JSON.parse(key);
            console.log(`Group: ${keyValues}, Count: ${count}`);
        }
       

    }




    /** -----------------   For HR view  -------------------------- */
    /*  =========================================================== */


    async getHrPlannings(start: Date, end: Date): Promise<BaseEvent[]> {

        let branchId = this.sessionSvc.branchId

        var humanResources = await this.resourceSvc.getHumanResourcesInclGroups()
        humanResources = humanResources.filter(hr => !hr.isGroup && hr.online && (!hr.hasEnd || hr.endDate > start) && (!hr.hasStart || hr.startDate < end))

        var humanResourceIds = humanResources.map(hr => hr.id)

        var getResourceIds = [...humanResourceIds, branchId]
        var resourceGroupIds = []




        let planningTypes = AlteaPlanningQueries.extraTypes()


        let aquasenseId = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'
        if (branchId == aquasenseId) {  // to support planning masks (fixed cleaning blocks wellness)
            let wellnessSupervisorId = '4a03c24f-286a-493d-8a1b-bb2b82d4e781'
            resourceGroupIds.push(wellnessSupervisorId)
            planningTypes.push(PlanningType.mask)
        }

        var extraPlannings = await this.alteaDb.getPlanningsByTypes(getResourceIds, resourceGroupIds, start, end, planningTypes, branchId)

        var absencePlannings = extraPlannings.filterByType(...AlteaPlanningQueries.absenceTypes())
        var availablePlannings = extraPlannings.filterByType(...AlteaPlanningQueries.availableTypes())


        const allEvents: BaseEvent[] = []


        let maskEvents = await this.doMasks(extraPlannings)
        allEvents.push(...maskEvents)





        var specialPlannings = extraPlannings.filterByType(PlanningType.edu)

        console.warn(humanResources)

        console.warn(absencePlannings)



        var branchClosed = absencePlannings.filterByResource(branchId).toDateRangeSet()


        for (let humanResource of humanResources) {

            /*
            let schedule = new Schedule()
            schedule.planning
            */

            var defaultSchedule = humanResource.schedules?.find(schedule => schedule.default)

            if (!defaultSchedule)
                continue

            var dateRangeSet = defaultSchedule.toDateRangeSet(start, end)

            // check if there are other overruling schedules
            let overrulingSchedules = humanResource.schedules.filter(schedule => schedule.id != defaultSchedule.id 
                && schedule.hasPlanningsBetween(start, end) )


            if (ArrayHelper.NotEmpty(overrulingSchedules)) {

                for (let overrulingSchedule of overrulingSchedules) {

                    let plannings = overrulingSchedule.getPlanningsBetween(start, end)

                    if (ArrayHelper.IsEmpty(plannings)) 
                        continue

                    for (let planning of plannings) {

                        let overRuleStart = planning.startDate > start ? planning.startDate : start
                        let overRuleEnd = planning.endDate < end ? planning.endDate : end
                        
                        dateRangeSet = dateRangeSet.removeBetween(overRuleStart, overRuleEnd)

                        let overRuleRangeSet = overrulingSchedule.toDateRangeSet(overRuleStart, overRuleEnd)

                        dateRangeSet = dateRangeSet.union(overRuleRangeSet)


                    }


                    //dateRangeSet = dateRangeSet.subtract(overrulingSchedule.toDateRangeSet(start, end))
                }
            }




            dateRangeSet.resource = humanResource

            var absencesForResource = absencePlannings.filterByResource(humanResource.id).toDateRangeSet()

            /** take into account a possibe start/end date for the resource */
            if (humanResource.hasEnd && humanResource.end)
                absencesForResource.addRangeByDates(humanResource.endDate, DateHelper.maxDate)

            if (humanResource.hasStart && humanResource.start)
                absencesForResource.addRangeByDates(DateHelper.minDate, humanResource.startDate)


            let availabilitiesForResource = availablePlannings.filterByResource(humanResource.id)

            if (availabilitiesForResource.notEmpty()) {

                /** these resourcePlannings (resourcePlanning.ors = true) overrule the default schedule for impacted days
                 * => first remove the corresponding full days, then add these plannings
                 */
                let overrulingAvailabilitiesForResource = availabilitiesForResource.filterByOverruleScheduleDay(true)

                if (overrulingAvailabilitiesForResource.notEmpty()) {

                    var overrulingRanges = overrulingAvailabilitiesForResource.toDateRangeSet()
                    var fullDayRanges = overrulingRanges.fullDayRanges()

                    dateRangeSet = dateRangeSet.subtract(fullDayRanges)
                    dateRangeSet = dateRangeSet.add(overrulingRanges)
                }


                let extraAvailabilitiesForResource = availabilitiesForResource.filterByOverruleScheduleDay(false)

                if (extraAvailabilitiesForResource.notEmpty()) {

                    var extraRanges = extraAvailabilitiesForResource.toDateRangeSet()

                    dateRangeSet = dateRangeSet.add(extraRanges)

                    console.warn('EXTRA AVAILABLE')
                    console.error(dateRangeSet)
                }


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

        let baseEvent = BaseEvent.newEventBase(orderUi.id, BaseEventType.Order, orderUi.shortInfo(), orderUi.startDate, orderUi.endDate, 'green')



           
        return baseEvent
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

        let orderUi = planningUi.order


        baseEvent.order = orderUi



         if (orderUi && ArrayHelper.NotEmpty(orderUi.vouchers)) {
            console.warn('Vouchers', orderUi.vouchers)
            baseEvent.vouchers = orderUi.vouchers
        } 


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

        let me =this

        await this.mutex.runExclusive(async () => {

            console.warn('updateEvents', eventType, events)

            if (!this.events)
                this.events = []
            else {


                // remove events of type eventType
                const toRemove = []
                for (let i = this.events.length - 1; i >= 0; i--) {
                    if (this.events[i]['type'] === eventType)
                        toRemove.push(i)
                }

                for (let idx of toRemove)
                    this.events.splice(idx, 1)

            }


         //   me.uniqEvents(me.events as BaseEvent[])

            this.events.push(...events)

        });


    }


    /** This is a callback function that is called by the OrderFirestoreService whenever there are changes to the visible orders 
     *  Important: this.* will not work (because it's coming from callback context), instead use context.*
    */
    async showPlanningUis(context: CalendarBase, planningUis: ResourcePlanningUi[]) {
        let events = []

        //planningUis = planningUis.filter(p => p.order.id == "8b8535d3-1ee2-4678-bc3a-0e136e981d6d")

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