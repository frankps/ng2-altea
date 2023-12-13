"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbObjectMulti = exports.DbObject = exports.DbQueryTyped = exports.DbQuery = exports.PrismaWhere = exports.OrderByProperty = exports.SortOrder = exports.AndQuery = exports.OrQuery = exports.QueryCondition = exports.QueryOperator = void 0;
var QueryOperator;
(function (QueryOperator) {
    QueryOperator["contains"] = "contains";
    QueryOperator["equals"] = "equals";
    QueryOperator["startsWith"] = "startsWith";
    QueryOperator["endsWith"] = "endsWith";
    QueryOperator["greaterThanOrEqual"] = "gte";
    QueryOperator["greaterThan"] = "gt";
    QueryOperator["lessThanOrEqual"] = "lte";
    QueryOperator["lessThan"] = "lt";
    QueryOperator["in"] = "in";
})(QueryOperator || (exports.QueryOperator = QueryOperator = {}));
class QueryCondition {
    constructor(field, operator = QueryOperator.equals, value) {
        this.operator = QueryOperator.equals;
        this.field = field;
        this.operator = operator;
        this.value = value;
    }
}
exports.QueryCondition = QueryCondition;
class OrQuery {
    constructor() {
        this.conditions = [];
    }
}
exports.OrQuery = OrQuery;
class AndQuery {
    constructor() {
        this.conditions = [];
    }
}
exports.AndQuery = AndQuery;
var SortOrder;
(function (SortOrder) {
    SortOrder["asc"] = "asc";
    SortOrder["desc"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class OrderByProperty {
    constructor(field, order = SortOrder.asc) {
        this.order = SortOrder.asc;
        this.field = field;
        this.order = order;
    }
}
exports.OrderByProperty = OrderByProperty;
class PrismaWhere {
}
exports.PrismaWhere = PrismaWhere;
class DbQuery {
    constructor() {
        // where = {
        //     or:  new OrQuery(),
        //     and: new AndQuery()
        // }
        this.where = {
            or: new Array(),
            and: new Array()
        };
        this.take = 10;
        this.order = new Array();
        this.selects = new Array();
        this.includes = new Array();
    }
    and(field, operator, value) {
        const condition = new QueryCondition(field, operator, value);
        this.where.and.push(condition);
    }
    or(field, operator, value) {
        const condition = new QueryCondition(field, operator, value);
        this.where.or.push(condition);
    }
    orderBy(field, order = SortOrder.asc) {
        const newOrder = new OrderByProperty(field, order);
        this.order.push(newOrder);
    }
    select(...fields) {
        this.selects.push(...fields);
    }
    include(...includes) {
        this.includes.push(...includes);
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
    getFilterArray(list) {
        const array = [];
        list.forEach(condition => {
            const comparison = {};
            comparison[condition.operator] = condition.value;
            const or = {};
            if (condition.field)
                or[condition.field] = comparison;
            array.push(or);
        });
        return array;
    }
    getPrismaFindManyArg() {
        const prisma = {
            where: new PrismaWhere(),
            take: this.take
        };
        if (this.where.or.length > 0)
            prisma.where['OR'] = this.getFilterArray(this.where.or);
        if (this.where.and.length > 0)
            prisma.where['AND'] = this.getFilterArray(this.where.and);
        return prisma;
    }
}
exports.DbQuery = DbQuery;
class DbQueryTyped extends DbQuery {
    constructor(typeName, type) {
        super();
        this.typeName = typeName;
        this.type = type;
    }
}
exports.DbQueryTyped = DbQueryTyped;
class DbObject {
    constructor(typeName, type, object) {
        this.typeName = typeName;
        this.type = type;
        this.object = object;
    }
}
exports.DbObject = DbObject;
class DbObjectMulti {
    constructor(typeName, type, objects) {
        this.typeName = typeName;
        this.type = type;
        this.objects = objects;
    }
}
exports.DbObjectMulti = DbObjectMulti;
//# sourceMappingURL=query.js.map