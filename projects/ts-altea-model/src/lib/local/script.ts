import { Action, ActionType } from "./action"
import { ArrayHelper, ObjectHelper } from "ts-common"
import { Job } from "./job"
import * as dateFns from 'date-fns'

export class Script {
    id: string
    name: string
    public actions: Action[] = []

    constructor(name: string, id?: string) {

        this.name = name

        if (!id)
            this.id = ObjectHelper.newGuid()
    }

    addAction(type: ActionType, args: any) {

        const action = new Action(type, args)
        this.actions.push(action)
    }

    hasActions(): boolean {

        return ArrayHelper.AtLeastOneItem(this.actions)

    }

    hasActionType(type: ActionType) {

        if (!this.hasActions())
            return false

        const idx = this.actions.findIndex(a => a.type == type)

        return idx >= 0
    }

    makeJob(date: number, eventId: string, offsetMinutes = 0) : Job {

        const jobDate = dateFns.addMinutes(date, offsetMinutes)

        const job = new Job(this.name, date, eventId)
        job.actions = this.actions

        return job


    }

}