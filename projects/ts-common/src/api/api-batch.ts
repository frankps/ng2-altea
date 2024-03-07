import { ApiResultBase } from "./api-result"
import { ApiStatus } from "./api-status"

export class ApiBatchProcess<ObjectType> {
    create?: ObjectType[] = []
    update?: unknown[] = []
    delete?: unknown[] = [] // list of ids or list of objects with key identifiers (example: many-many relations)


    hasChanges() {

        if (this.create && this.create.length > 0) return true
        if (this.update && this.update.length > 0) return true
        if (this.delete && this.delete.length > 0) return true

        return false
    }
}


export class ApiBatchItemResult<T> extends ApiResultBase {

    // status: ApiStatus
    // message?: string
    object: T | { id: string } | unknown

    constructor(obj: T | { id: string } | unknown, status: ApiStatus = ApiStatus.ok, message?: string) {
        super()
        
        this.object = obj
        this.status = status
        this.message = message
    }
}

export class ApiBatchResult<T> extends ApiResultBase {

    update: ApiBatchItemResult<unknown>[] = []
    create: ApiBatchItemResult<T>[] = []
    delete: ApiBatchItemResult<T>[] = []

    // status: ApiStatus = ApiStatus.notProcessed
    // message?: string

    /** Number of errors */
    errors = 0
}