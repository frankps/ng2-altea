import { Exclude, Type, Transform } from "class-transformer";
import { DbObjectCreate } from "../api";
import { ObjectHelper } from "./object-helper";

export class RemovedFromCollection {

  constructor(public col: string, public id: string) {

  }
}

export class ObjectMgmt {
  /** new, set to true if new */
  n?: boolean

  /** updated, set to true if updated/dirty */
  u?: boolean

  /** removed ids from collections */
  r?: { [collection: string]: string[] }

  /** updated fields=properties */
  f?: string[]

  setDirty(...fields: string[]) {

    if (!Array.isArray(fields) || fields.length == 0)
      return

    this.u = true

    if (!Array.isArray(this.f))
      this.f = []

    this.f.push(...fields)

  }


}


/**
 *  A managed object has has an 'm' property that keeps track if it's status.
 *  This property has some sub-properties:
 *    n:new, u:updated (f:the updated fields), d:deleted
 */
export abstract class ManagedObject {

  /** management property to manage object in back-end, not saved in db!  */
  @Type(() => ObjectMgmt)
  m = new ObjectMgmt()

  isNew() {
    return (this.m?.n == true)
  }

  markAsNew() {
    if (!this.m)
      this.m = new ObjectMgmt()

    this.m.n = true
  }

  markAsRemoved(collection: string, id: string) {
    if (!this.m)
      this.m = new ObjectMgmt()

    if (!this.m.r)
      this.m.r = {}

    if (!this.m.r[collection]) {
      this.m.r[collection] = [id]

      console.error(this.m.r)

      return
    }

    const ids = this.m.r[collection]
    ids.push(id)

    console.error(this.m.r)
  }

  markAsUpdated(...fields: string[]) {
    if (!this.m)
      this.m = new ObjectMgmt()

    this.m.u = true

    if (Array.isArray(fields) && fields.length > 0) {
      if (!this.m.f)
        this.m.f = []

      fields.forEach(f => {

        if (this.m.f && this.m.f.indexOf(f) == -1)
          this.m.f.push(f)
      })
    }
  }


  /**
   * if the management property (m) contains a list of fields (m.f), then return an object of only these fields
   * @param object 
   * @returns 
   */
  static getUpdatedPropertiesOnly(object: ManagedObject): any {

    if (!Array.isArray(object?.m?.f))
      return undefined

    const update = {}

    for (const property of object.m.f) {
      update[property as keyof object] = object[property as keyof object]
    }

    return update
  }
}


export abstract class ObjectWithId extends ManagedObject {
  public id?: string;

  constructor() {
    super()

    this.id = ObjectHelper.newGuid()

    /** declare this object as new */
    // this.m.n = true
  }

  //   @Type(() => ObjectMgmt)

}

export abstract class ObjectWithIdPlus extends ObjectWithId {

  /** object is active */
  public act: boolean = true

  /** object is deleted */
  public del: boolean = false

  /** last update performed on object (starting with creation and ending with soft delete => del=true) */
  @Type(() => Date)
  public upd: Date = new Date()

}


export class ObjectReference {
  id?: string
  name?: string
}


export interface IAsDbObject<T> {
  asDbObject(): DbObjectCreate<T>
}