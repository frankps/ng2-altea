import { th } from "date-fns/locale";
import { ArrayHelper, ObjectHelper } from "../lib";
import { ObjectWithId } from "../lib/object-with-id"
import { ApiBatchProcess } from "./api-batch"
import * as _ from "lodash";
import { instanceToPlain } from "class-transformer";


type EmptyObject = {
  [key: string]: any;
}



export class CollectionChangeTrackerParams {
  /** columns that make up id */
  idProperties? = ['id']
  propsToUpdate?: string[] = []
  propsToRemove?: string[] = []
  deleteUniqueKey?: string

  orderByProps?: string[] = []

  // enableCancel?= false
}

export class CollectionChangeTracker<T extends ObjectWithId> {

  updateIds: string[] = []
  createIds: string[] = []
  deleteIds: unknown[] = []

  /** collection with original objects: used when user cancels operation */
  colOrig: T[] = []

  constructor(public col: T[], protected type: { new(): T; }
    , protected params: CollectionChangeTrackerParams = new CollectionChangeTrackerParams()) {

    if (!col)
      col = []

    this.colOrig = col.map(obj => ObjectHelper.clone(obj, this.type))




    console.log(col)
    // if (params.enableCancel) {
    // }

  }


  orderedCol() {

    if (Array.isArray(this.params.orderByProps) && this.params.orderByProps.length > 0) {
      const col = _.orderBy(this.col, this.params.orderByProps)
      return col
    }

    return this.col

  }

  getById(id: string) {

    if (ArrayHelper.IsEmpty(this.col))
      return null

    var item = this.col.find(i => i.id == id)

    return item
  }

  cancel() {
    this.reset()

    /** we want to keep same array */
    this.col.splice(0, this.col.length)

    this.colOrig.forEach(obj => {
      const orig = ObjectHelper.clone(obj, this.type)
      this.col.push(orig)
    })
  }

  reset() {
    this.updateIds = []
    this.createIds = []
    this.deleteIds = []
  }

  hasChanges() {
    return (this.updateIds.length > 0 || this.createIds.length > 0 || this.deleteIds.length > 0)
  }

  updateId(id?: string) {
    if (!id) return

    // if we update newly created objects, then it doesn't count as an update
    if (this.createIds.indexOf(id) >= 0)
      return

    if (this.updateIds.indexOf(id) == -1)
      this.updateIds.push(id)
  }

  update(object: T) {
    this.updateId(object.id)
  }

  add(object: T) {

    if (!object.id)
      return

    this.col.push(object)
    this.createId(object.id)

  }

  createId(id?: string) {
    if (!id) return
    this.createIds.push(id)
  }

  delete(object: T) {
    this.deleteId(object.id)

  }

  get length() {
    if (this.col)
      return this.col.length
    else
      return 0
  }

  /** Checks the maximum value of a certain property in the collection. If no elements in collection, then initialMaxValue is returned.  */
  maxValue(property = 'idx', initialMaxValue = 0): number {

    if (!this.col)
      return initialMaxValue

    const maxObj = _.maxBy(this.col, property)

    if (maxObj)
      return maxObj[property as keyof object]
    else
      return initialMaxValue
  }

  hasPropertyValue(property = 'idx', value: unknown) {

    if (!this.col) return false

    const idx = this.col.findIndex(item => item[property as keyof object] == value)

    return idx >= 0
  }


  /** For most types, we just transfer list of id's to the back-end, but for objects without an id (a link table for instance),
   *  we transfer small objects that represents a unique record in the table
   */
  deleteId(id?: string) {
    if (!id || !this.col) return

    const removedObjects = _.remove(this.col, (obj: ObjectWithId) => obj.id === id)

    if (!removedObjects || removedObjects.length == 0)
      return

    const removed = removedObjects[0]


    // if object was just created (and not saved in back-end) => no need to remove back-end
    const justCreated = _.remove(this.createIds, idCreate => idCreate === id)

    if (justCreated && justCreated.length > 0)
      return

    // if object will be deleted, we can forget updates
    _.remove(this.updateIds, idUpdate => idUpdate === id)

    const idOrIdObject = this.getId(removed)

    this.deleteIds.push(idOrIdObject)

    /*
    if (this.params.idProperties && this.params.idProperties.length > 0 && this.params.idProperties[0] != 'id') {
      let objToRemove: EmptyObject = {}

      this.params.idProperties.forEach(idProp => objToRemove[idProp as keyof object] = removed[idProp as keyof object])

      this.deleteIds.push(objToRemove)

    } else
      this.deleteIds.push(id)
    */
  }


  /** Most often, an id is just a string, but some link tables have a combined key instead of a string id.
   * In that case an object is returned with all properties that make up the key
   */
  getId(obj: any): any {

    if (this.params.idProperties && this.params.idProperties.length > 0 && this.params.idProperties[0] != 'id') {
      let idObject: EmptyObject = {}

      this.params.idProperties.forEach(idProp => idObject[idProp as keyof object] = obj[idProp as keyof object])

      return idObject

    } else
      return obj.id
  }


  createPartialObjectForUpdate(obj: ObjectWithId, propsToUpdate?: string[]): any {

    if (!Array.isArray(propsToUpdate) || propsToUpdate.length == 0)
      return obj

    const sub: any = {}
    sub['id'] = obj.id


    const origObject = this.colOrig.find(orig => orig.id == obj.id)

    let nrOfPropsToUpdate = 0

    propsToUpdate.forEach(prop => {

      const objHasProperty = Object.prototype.hasOwnProperty.call(obj, prop)
      const isSame = origObject && _.isEqual(origObject[prop as keyof object], obj[prop as keyof object])

      if (objHasProperty && !isSame) {
        sub[prop as keyof object] = obj[prop as keyof object]
        nrOfPropsToUpdate++
      }

    })

    return nrOfPropsToUpdate === 0 ? null : sub
  }


  createPartialObjectByRemovingProps(obj: any, isUpdate: boolean, propsToRemove?: string[]): any {

    if (!Array.isArray(propsToRemove) || propsToRemove.length == 0)
      return obj

    const clone = instanceToPlain(obj) //ObjectHelper.clone(obj, this.type)

    if (isUpdate) {   // was needed for types without an id, but having instead combined keys 
      clone['id'] = this.getId(obj)
    }

    propsToRemove.forEach(prop => {
      delete clone[prop]
    })


    return clone
  }


  // Remove props based on
  //   propsToRemove 

  // for doing inserts

  getApiBatch(updateAll = false, onlyId?: string): ApiBatchProcess<T> {


    console.warn(this.col)

    const batch = new ApiBatchProcess<T>()


    let objectsToUpdate = []

    if (updateAll)
      objectsToUpdate = this.col?.filter(i => i.id ? this.createIds.indexOf(i.id) == -1 : false)
    else if (onlyId) {
      objectsToUpdate = this.col?.filter(i => i.id === onlyId)
    } else
      objectsToUpdate = this.col?.filter(i => i.id ? this.updateIds.indexOf(i.id) >= 0 && this.createIds.indexOf(i.id) == -1 : false)


    if (this.params.propsToUpdate && this.params.propsToUpdate.length > 0)
      batch.update = objectsToUpdate.map(obj => this.createPartialObjectForUpdate(obj, this.params.propsToUpdate)).filter(obj => obj != null)
    else {
      /* 
      */
      batch.update = objectsToUpdate.map(obj => this.createPartialObjectByRemovingProps(obj, true, this.params.propsToRemove))
    }

    // if (this.params.propsToRemove && this.params.propsToRemove.length > 0)
    //   batch.update = batch.update.map(obj => this.createPartialObjectByRemovingProps(obj, this.params.propsToRemove))


    batch.delete = this.deleteIds

    batch.create = this.col?.filter(i => i.id ? this.createIds.indexOf(i.id) >= 0 : false)
    batch.create = batch.create.map(obj => this.createPartialObjectByRemovingProps(obj, false, this.params.propsToRemove))

    return batch

  }

  //const batch = new ApiBatchProcess<Price>()
}
