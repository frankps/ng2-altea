
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiListResult, ApiResult, ApiStatus, DateHelper, DbObjectMulti, DbObjectMultiCreate, DbQuery, DbQueryTyped, QueryOperator } from 'ts-common'
import { Order, AvailabilityContext, AvailabilityRequest, AvailabilityResponse, Schedule, SchedulingType, ResourceType, ResourceRequest, TimeSpan, SlotInfo, PossibleSlots, ReservationOption, Solution, ResourcePlanning, PlanningInfo, PlanningProductInfo, PlanningContactInfo, PlanningResourceInfo, OrderState, Template, Message, MsgType, Branch, MsgInfo, OrderLine, Subscription, TaskSchedule, Task, TaskStatus } from 'ts-altea-model'
import { Observable } from 'rxjs'
import { AlteaDb } from '../general/altea-db'
import { IDb } from '../interfaces/i-db'
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as _ from "lodash"



export class TaskSchedulingService {

    alteaDb: AlteaDb

    constructor(db: IDb | AlteaDb) {

        if (db instanceof AlteaDb)
            this.alteaDb = db
        else
            this.alteaDb = new AlteaDb(db)
    }


    async instantiateRecurringTasks(includeLessFrequentTasks: boolean = true) : Promise<ApiListResult<Task>> {

        try {

            console.error('instantiateRecurringTasks')

            const recurTasks = await this.alteaDb.getRecurringTasks()

            const newRecurTaskInstances: Task[] = []

            let newDayTasks = await this.tasksToPerformForPeriod(recurTasks, TaskSchedule.daily)
            let newTwiceAWeekTasks = await this.tasksToPerformForPeriod(recurTasks, TaskSchedule.twiceAWeek)
            let newWeekTasks = []
            let newMonthTasks = []
            let newQuarterTasks = []

            if (includeLessFrequentTasks) {
                newWeekTasks = await this.tasksToPerformForPeriod(recurTasks, TaskSchedule.weekly)
                newMonthTasks = await this.tasksToPerformForPeriod(recurTasks, TaskSchedule.monthly)
                newQuarterTasks = await this.tasksToPerformForPeriod(recurTasks, TaskSchedule.quarterly)
            }



            newRecurTaskInstances.push(...newDayTasks, ...newTwiceAWeekTasks, ...newWeekTasks, ...newMonthTasks, ...newQuarterTasks)

            // still to do: days, months

            if (newRecurTaskInstances.length == 0) {
                console.log(`No new tasks!`)
                return new ApiListResult<Task>([], ApiStatus.ok, 'No new tasks!')
            }

            const newTasks = this.makeConcreteTasks(newRecurTaskInstances)

            let dbNewTasks = new DbObjectMultiCreate<Task>('task', Task, newTasks)
            let res = await this.alteaDb.db.createMany$<Task>(dbNewTasks)

            console.error(res)

            return res

        } catch (error) {
            console.error(error)
            throw error
        }

    }

    makeConcreteTasks(recurTasks: Task[]): Task[] {

        if (!Array.isArray(recurTasks))
            return []

        const instances = recurTasks.map(rTask => rTask.toInstance())

        return instances
    }

    async tasksToPerformForPeriod(recurTasks: Task[], schedule: TaskSchedule): Promise<Task[]> {

        const periodTasks = recurTasks.filter(t => t.schedule == schedule)

        if (!Array.isArray(periodTasks) || periodTasks.length == 0)
            return []

        const periodTaskIds = periodTasks.map(task => task.id)

        let finishedAfter = new Date()

        switch (schedule) {
            case TaskSchedule.daily:
                //finishedAfter = dateFns.addDays(finishedAfter, -1)
                finishedAfter = dateFns.startOfDay(finishedAfter)
                break
            case TaskSchedule.twiceAWeek:
                finishedAfter = dateFns.addDays(finishedAfter, -3)
                break
            case TaskSchedule.weekly:
                finishedAfter = dateFns.addWeeks(finishedAfter, -1)
                break
            case TaskSchedule.twiceAMonth:
                finishedAfter = dateFns.addWeeks(finishedAfter, -2)
                break
            case TaskSchedule.monthly:
                finishedAfter = dateFns.addMonths(finishedAfter, -1)
                break
            case TaskSchedule.quarterly:
                finishedAfter = dateFns.addMonths(finishedAfter, -3)
                break
            default:
                return []
        }

        /*

        For the recurring tasks, we get:
        1/ still open (instances of recurring) tasks = recurring tasks NOT yet finished
        2/ already finished tasks within period (example) weekly => we don't need to re-instantiate this recurring tasks since they were already finished within period

        */

        const tasksForPeriod = await this.alteaDb.getTasksToDoORFinishedAfter(periodTaskIds, finishedAfter)

        // finished tasks within period (=> it's ok, task is finished for period => no need to recreate at this moment)
        const finishedTasks = tasksForPeriod.filter(t => t.status == TaskStatus.done || t.status == TaskStatus.skip)
        const finishedPeriodTaskIds = finishedTasks.map(t => t.rTaskId)

        // still open tasks waiting for completion (=> also no need to recreate, already existing)
        const existingToDos = tasksForPeriod.filter(t => t.status == TaskStatus.todo || t.status == TaskStatus.progress)
        const existingToDoIds = existingToDos.map(t => t.rTaskId)

        // from all recurring tasks for period, remove the 2 sets above => we only need to recreate the resulting set 
        let toDoPeriodTaskIds = _.difference(periodTaskIds, finishedPeriodTaskIds)
        toDoPeriodTaskIds = _.difference(toDoPeriodTaskIds, existingToDoIds)

        if (toDoPeriodTaskIds.length == 0)
            return []

        const toDo = recurTasks.filter(t => toDoPeriodTaskIds.indexOf(t.id) >= 0)
        return toDo
    }




}   