import { ActionLog, ActionStatus } from "./action"
import { Script } from "./script"

export enum JobStatus {
    scheduled = 'scheduled',
    error = 'error',
    done = 'done',
    ok = 'ok'
}

export class ScriptLog {
    status: JobStatus = JobStatus.ok
    actions: ActionLog[] = []

    logAction(status: ActionStatus, msg?: string) {
        this.actions.push(new ActionLog(status, msg))

        if (status != ActionStatus.ok)
            this.status = JobStatus.error
    }

    log(actionLog: ActionLog) {
        this.actions.push(actionLog)

        if (actionLog.status != ActionStatus.ok)
            this.status = JobStatus.error
    }
}




export class Job extends Script {

    date: number
    eventId: string
    
    status: JobStatus = JobStatus.scheduled

    constructor(name: string, date: number, eventId: string, id?: string) {
        super(name, id)

        this.date = date
        this.eventId = eventId

    }



}
