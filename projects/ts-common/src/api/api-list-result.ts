import { ApiResultBase } from "./api-result"

export class ApiListResult<T> extends ApiResultBase {
  data: T[]

  constructor(data: T[] = []) {
    super()
    this.data = data
  }
}

