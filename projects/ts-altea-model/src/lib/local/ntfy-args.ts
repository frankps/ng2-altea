import { ActionArgs } from "./action";

export class NtfyArgs extends ActionArgs {
    constructor(public topic: string, public title: string, public message: string) {
        super()
    }
}