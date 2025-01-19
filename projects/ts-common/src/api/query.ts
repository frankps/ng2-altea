import { extend } from "lodash"
import { ObjectWithId } from "../lib"
import { Type } from "class-transformer"



export enum QueryOperator {
  contains = 'contains',
  equals = 'equals',
  not = 'not',
  startsWith = 'startsWith',
  endsWith = 'endsWith',
  greaterThanOrEqual = 'gte',
  greaterThan = 'gt',
  lessThanOrEqual = 'lte',
  lessThan = 'lt',
  in = 'in',
  hasSome = 'hasSome',
  has = 'has',
  notIn = 'notIn',

  /** filter on relations */
  some = 'some'
}

export class QueryCondition {
  field?: string
  operator: QueryOperator = QueryOperator.equals
  value?: any

  /*
  @Type(() => QueryCondition)
  or: Array<QueryCondition> = Array<QueryCondition>()
*/

  where: QueryWhere

  constructor() {
  }

  static filter(field?: string, operator: QueryOperator = QueryOperator.equals, value?: any): QueryCondition {

    let condition = new QueryCondition()

    condition.field = field
    condition.operator = operator
    condition.value = value

    return condition
  }

  or(field?: string, operator: QueryOperator = QueryOperator.equals, value?: any): QueryCondition {
    let condition

    if (field)
      condition = QueryCondition.filter(field, operator, value)
    else
      condition = new QueryCondition()

    if (!this.where)
      this.where = new QueryWhere()

    this.where.or.push(condition)
    return this
  }

  and(field?: string, operator: QueryOperator = QueryOperator.equals, value?: any): QueryCondition {
    let condition

    if (field)
      condition = QueryCondition.filter(field, operator, value)
    else
      condition = new QueryCondition()

    if (!this.where)
      this.where = new QueryWhere()

    this.where.and.push(condition)
    return this
  }

}

export class OrQuery {
  conditions: QueryCondition[] = []
}

export class AndQuery {
  conditions: QueryCondition[] = []
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc'
}

export class OrderByProperty {
  field?: string
  order: SortOrder = SortOrder.asc

  constructor(field?: string, order: SortOrder = SortOrder.asc) {
    this.field = field
    this.order = order
  }
}


export class PrismaWhere {
  AND?: any[]
  OR?: any[]
}

export class QueryWhere {
  or: Array<QueryCondition> = Array<QueryCondition>()
  and: Array<QueryCondition> = new Array<QueryCondition>()
}

export class DbQueryBase {
  /*
  where = {
    or: new Array<QueryCondition>(),
    and: new Array<QueryCondition | PrismaWhere>()
  }*/

  @Type(() => QueryWhere)
  where: QueryWhere = new QueryWhere()


  and(field?: string, operator: QueryOperator = QueryOperator.equals, value?: any): QueryCondition {
    let condition: QueryCondition

    if (field)
      condition = QueryCondition.filter(field, operator, value)
    else
      condition = new QueryCondition()

    this.where.and.push(condition)
    return condition
  }

  or(field?: string, operator: QueryOperator = QueryOperator.equals, value?: any): DbQueryBase {
    let condition: QueryCondition

    if (field)
      condition = QueryCondition.filter(field, operator, value)
    else
      condition = new QueryCondition()

    this.where.or.push(condition)
    return condition
  }
}

export class DbQueryBaseTyped<T> extends DbQueryBase {

  constructor(public typeName: string, public type?: { new(): T; }) {
    super()
  }


}

export class DbUpdateMany<T> extends DbQueryBase {

  update: T


}

export class DbUpdateManyWhere<T> {
  where = {}
  data = {}

  constructor(public typeName: string, public type?: { new(): T; }) {
  }

  addWhere(field: string, value: any) {
    this.where[field] = value
  }

  set(field: string, value: any) {
    this.data[field] = value
  }
}

export class DbQuery extends DbQueryBase {

  // where = {
  //     or:  new OrQuery(),
  //     and: new AndQuery()
  // }



  take = 50

  order = new Array<OrderByProperty>()
  selects = new Array<string>()


  includes = new Array<string>()



  orderBy(field?: string, order: SortOrder = SortOrder.asc): DbQuery {
    const newOrder = new OrderByProperty(field, order)
    this.order.push(newOrder)
    return this
  }

  orderByDesc(field?: string): DbQuery {
    const newOrder = new OrderByProperty(field, SortOrder.desc)
    this.order.push(newOrder)
    return this
  }

  select(...fields: string[]): DbQuery {
    this.selects.push(...fields)
    return this
  }

  include(...includes: string[]): DbQuery {
    this.includes.push(...includes)
    return this
  }




  /*
  getFilterArray can be used to build the OR/AND array of the where clause of a Prisma query:    

    where: {
      OR: [
      {
          title: {
          contains: 'Prisma',
          },
      },
      {
          title: {
          contains: 'databases',
          },
      },
      ]
    }


  */
  getFilterArray(list: Array<QueryCondition>): any[] {

    const array: any[] = []

    list.forEach(condition => {

      /*       if (!(condition instanceof QueryCondition))
              return */

      const comparison: any = {}
      comparison[condition.operator] = condition.value

      const or: any = {}

      if (condition.field)
        or[condition.field] = comparison

      array.push(or)
    })

    return array
  }

  getPrismaFindManyArg() {

    const prisma = {
      where: new PrismaWhere(),
      take: this.take
    }

    if (this.where.or.length > 0)
      prisma.where['OR' as keyof PrismaWhere] = this.getFilterArray(this.where.or)

    if (this.where.and.length > 0)
      prisma.where['AND' as keyof PrismaWhere] = this.getFilterArray(this.where.and)

    return prisma
  }
}

export class DbQueryTyped<T> extends DbQuery {

  constructor(public typeName: string, public type?: { new(): T; }) {
    super()
  }


}

/**
 *  Typically used for updating object:
 *  Inp: partial object having an id and only those properties to update {id: 'abc', propToUpodate: 'update' }
 *  Out: the full object type to return
 */
export class DbObject<Out> {
  /**
   * 
   * @param typeName 
   * @param type 
   * @param object 
   * 
   */
  constructor(public typeName: string, public type: { new(): Out; }, public object: any) {
  }
}


export class DbObjectCreate<T> {
  /**
   * 
   * @param typeName 
   * @param type 
   * @param object 
   * 
   */
  constructor(public typeName: string, public type: { new(): T; }, public object: T) {
  }
}
``
/**
 *  Typically used for updating objects:
 *  Inp: partial objects having an id and only those properties to update {id: 'abc', propToUpodate: 'update' }
 *  Out: the full object type to return
 */
export class DbObjectMulti<Inp, Out> {
  constructor(public typeName: string, public type: { new(): Out; }, public objects: Inp[]) {
  }
}


/**
 *  Typically used for inserting
 */
export class DbObjectMultiCreate<T> extends DbObjectMulti<T, T> {
  constructor(typeName: string, type: { new(): T; }, objects: T[]) {
    super(typeName, type, objects)
  }
}
