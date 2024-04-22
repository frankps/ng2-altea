import { ApiResultBase } from "./api-result"
import { ApiStatus } from "./api-status"

export class ApiListResult<T> extends ApiResultBase {
  data: T[]

  constructor(data: T[] = [], status: ApiStatus = ApiStatus.ok, message: string = "") {
    super()
    this.data = data
    this.status = status
    this.message = message
  }
}

