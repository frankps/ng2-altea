import { Exclude, Type, Transform } from "class-transformer";
import { DbObject } from "../api";
import { ObjectHelper } from "./object-helper";

export class ObjectMgmt {
  /** new, set to true if new */
  n?: boolean

  /** updated, set to true if updated/dirty */
  u?: boolean

  /** deleted, set to true if deleted */
  d?: boolean

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


  markAsNew() {
    if (!this.m)
      this.m = new ObjectMgmt()

    this.m.n = true
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


export class ObjectReference {
  id?: string
  name?: string
}


export interface IAsDbObject<T> {
  asDbObject(): DbObject<T>
}