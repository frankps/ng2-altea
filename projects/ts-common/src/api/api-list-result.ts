import { ArrayHelper } from "../lib"
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

  get hasData(): boolean {

    return this.isOk && ArrayHelper.NotEmpty(this.data)

  }

  get first(): T {

    if (this.hasData)
      return this.data[0]
    else
      return null
    
  }

}

