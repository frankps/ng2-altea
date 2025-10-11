import { ArrayHelper } from "../lib"
import { ApiStatus } from "./api-status"
import * as _ from "lodash"

export class DeleteManyResult {
  count: number
}

export class ApiResultBase {
  status: ApiStatus = ApiStatus.notProcessed

  message?: string

  error: any

  get isOk(): boolean {
    return this.status == ApiStatus.ok
  }

  get notOk(): boolean {
    return this.status != ApiStatus.ok
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

  static error(message?: string, error?, obj?) : ApiResult {

    let res = new ApiResult(obj, ApiStatus.error, message)
    res.error = error

    return res
  }

  static warning(message?: string, obj?) : ApiResult {

    let res = new ApiResult(obj, ApiStatus.warning, message)
    
    return res

  }

  static ok(message?: string, obj?) : ApiResult {

    let res = new ApiResult(obj, ApiStatus.ok, message)
    
    return res

  }

  static countOk<T>(results: ApiResult<T>[]) : number {

    if (ArrayHelper.IsEmpty(results))
      return 0

    let oks = results.filter(result => result?.status == ApiStatus.ok)

    return oks.length

  }

  static atLeastOneOk<T>(results: ApiResult<T>[]) : boolean {

    if (ArrayHelper.IsEmpty(results))
      return false

    let okResult = results.find(result => result?.status == ApiStatus.ok)

    return okResult ? true : false
  }

}
