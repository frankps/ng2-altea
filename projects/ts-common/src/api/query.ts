


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
  in = 'in'
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

  take = 10

  order = new Array<OrderByProperty>()
  selects = new Array<string>()

  
  includes = new Array<string>()

  and(field: string, operator: QueryOperator, value?: any) {
    const condition = new QueryCondition(field, operator, value)
    this.where.and.push(condition)
  }

  or(field: string, operator: QueryOperator, value?: any) {
    const condition = new QueryCondition(field, operator, value)
    this.where.or.push(condition)
  }

  orderBy(field?: string, order: SortOrder = SortOrder.asc) {
    const newOrder = new OrderByProperty(field, order)
    this.order.push(newOrder)
  }

  select(...fields: string[]) {
    this.selects.push(...fields)
  }

  include(...includes: string[]) {
    this.includes.push(...includes)
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


export class DbObject<T> {
  constructor(public typeName: string, public type: { new(): T; }, public object: T) {
  }
}

export class DbObjectMulti<T> {
  constructor(public typeName: string, public type: { new(): T; }, public objects: T[]) {
  }
}
