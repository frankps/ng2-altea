
export class WebPushMessage {
/*     title: string
    body: string */

    constructor(public title: string, public body?: string) {}
}


export class WebPushToUsers extends WebPushMessage {

    userIds: string[] = []

    constructor(title: string, body?: string) {
        super(title, body)

    }
}