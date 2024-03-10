import { ObjectWithId } from "../lib"



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
  hasSome = 'hasSome'
}

export class QueryCondition {
  field?: string
  operator: QueryOperator = QueryOperator.equals
  value?: any

  constructor(field?: string, operator: QueryOperator = QueryOperator.equals, value?: any) {

    this.field = field
    this.operator = operator
    this.value = value

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


export class DbQuery {

  // where = {
  //     or:  new OrQuery(),
  //     and: new AndQuery()
  // }



  where = {
    or: new Array<QueryCondition>(),
    and: new Array<QueryCondition>()
  }

  take = 50

  order = new Array<OrderByProperty>()
  selects = new Array<string>()


  includes = new Array<string>()

  and(field: string, operator: QueryOperator, value?: any): DbQuery {
    const condition = new QueryCondition(field, operator, value)
    this.where.and.push(condition)
    return this
  }

  or(field: string, operator: QueryOperator, value?: any): DbQuery {
    const condition = new QueryCondition(field, operator, value)
    this.where.or.push(condition)
    return this
  }

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

  constructor(public typeName: string, public type: { new(): T; }) {
    super()
  }


}

/**
 *  Typically used for updating object:
 *  Inp: partial object having an id and only those properties to update {id: 'abc', propToUpodate: 'update' }
 *  Out: the full object type to return
 */
export class DbObject<Inp, Out> {
  /**
   * 
   * @param typeName 
   * @param type 
   * @param object 
   * 
   */
  constructor(public typeName: string, public type: { new(): Out; }, public object: Inp) {
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
export class DbObjectMultiCreate<T> extends DbObjectMulti<T, T>{
  constructor(typeName: string, type: { new(): T; }, objects: T[]) {
    super(typeName, type, objects)
  }
}
