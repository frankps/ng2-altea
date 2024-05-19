export enum ActionType {
    sendMail = 'sendMail',
    luxom = 'luxom',
    luxomState = 'luxomState',
    script = 'script'
}

export class ActionArgs {

}

export class Action {

    constructor(public type: string, public args: ActionArgs) {

    }
}



export enum ActionStatus {
    ok = 'ok',
    error = 'error'
}

export class ActionLog {
    constructor(public status: ActionStatus, public msg?: string) { }
}