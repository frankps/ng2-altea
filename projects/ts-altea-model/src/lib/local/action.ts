export enum ActionType {
    sendMail = 'sendMail',
    luxom = 'luxom',
    luxomState = 'luxomState',
    script = 'script',
    doorAccess = 'doorAccess'
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


export class DoorAccessArgs extends ActionArgs {

    /**
     * 
     * @param enable 
     */
    constructor(public enable: boolean, public contactName: string, public orderId: string, public contactId: string, public code: string, public doors: string[]) {
        super()
    }


}