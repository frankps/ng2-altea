import { ApiStatus } from "./api-status"


export class ApiResultBase {
  status: ApiStatus = ApiStatus.notProcessed

  message?: string


  get isOk(): boolean {
    return this.status == ApiStatus.ok
  }


}

export class ApiMultiResult extends ApiResultBase {

  results: ApiResultBase[] = []

  addSingle(result: ApiResultBase) {
    
    if (!result)
      return

    if (this.results.length == 0)
      this.status = result.status
    else {
      if (result.status != ApiStatus.ok)
        this.status = result.status
    }

    this.results.push(result)
  }

  add(...results: ApiResultBase[]) {
    results.forEach(res => this.addSingle(res))
  }

  constructor(...results: ApiResultBase[]) {
    super()

    this.add(...results)

  }

}

export class ApiResult<T = null> extends ApiResultBase {

  object: T

  constructor(obj: T, status: ApiStatus = ApiStatus.ok, message?: string) {
    super()

    this.object = obj
    this.status = status
    this.message = message
  }

  static error(message?: string) : ApiResult {

    let res = new ApiResult(null, ApiStatus.error, message)

    return res

  }


}
