"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbObjectMultiCreate = exports.DbObjectMulti = exports.DbObjectCreate = exports.DbObject = exports.DbQueryTyped = exports.DbQuery = exports.PrismaWhere = exports.OrderByProperty = exports.SortOrder = exports.AndQuery = exports.OrQuery = exports.QueryCondition = exports.QueryOperator = void 0;
var QueryOperator;
(function (QueryOperator) {
    QueryOperator["contains"] = "contains";
    QueryOperator["equals"] = "equals";
    QueryOperator["not"] = "not";
    QueryOperator["startsWith"] = "startsWith";
    QueryOperator["endsWith"] = "endsWith";
    QueryOperator["greaterThanOrEqual"] = "gte";
    QueryOperator["greaterThan"] = "gt";
    QueryOperator["lessThanOrEqual"] = "lte";
    QueryOperator["lessThan"] = "lt";
    QueryOperator["in"] = "in";
    QueryOperator["hasSome"] = "hasSome";
})(QueryOperator || (exports.QueryOperator = QueryOperator = {}));
var QueryCondition = /** @class */ (function () {
    function QueryCondition(field, operator, value) {
        if (operator === void 0) { operator = QueryOperator.equals; }
        this.operator = QueryOperator.equals;
        this.field = field;
        this.operator = operator;
        this.value = value;
    }
    return QueryCondition;
}());
exports.QueryCondition = QueryCondition;
var OrQuery = /** @class */ (function () {
    function OrQuery() {
        this.conditions = [];
    }
    return OrQuery;
}());
exports.OrQuery = OrQuery;
var AndQuery = /** @class */ (function () {
    function AndQuery() {
        this.conditions = [];
    }
    return AndQuery;
}());
exports.AndQuery = AndQuery;
var SortOrder;
(function (SortOrder) {
    SortOrder["asc"] = "asc";
    SortOrder["desc"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
var OrderByProperty = /** @class */ (function () {
    function OrderByProperty(field, order) {
        if (order === void 0) { order = SortOrder.asc; }
        this.order = SortOrder.asc;
        this.field = field;
        this.order = order;
    }
    return OrderByProperty;
}());
exports.OrderByProperty = OrderByProperty;
var PrismaWhere = /** @class */ (function () {
    function PrismaWhere() {
    }
    return PrismaWhere;
}());
exports.PrismaWhere = PrismaWhere;
var DbQuery = /** @class */ (function () {
    function DbQuery() {
        // where = {
        //     or:  new OrQuery(),
        //     and: new AndQuery()
        // }
        this.where = {
            or: new Array(),
            and: new Array()
        };
        this.take = 50;
        this.order = new Array();
        this.selects = new Array();
        this.includes = new Array();
    }
    DbQuery.prototype.and = function (field, operator, value) {
        var condition = new QueryCondition(field, operator, value);
        this.where.and.push(condition);
        return this;
    };
    DbQuery.prototype.or = function (field, operator, value) {
        var condition = new QueryCondition(field, operator, value);
        this.where.or.push(condition);
        return this;
    };
    DbQuery.prototype.orderBy = function (field, order) {
        if (order === void 0) { order = SortOrder.asc; }
        var newOrder = new OrderByProperty(field, order);
        this.order.push(newOrder);
        return this;
    };
    DbQuery.prototype.orderByDesc = function (field) {
        var newOrder = new OrderByProperty(field, SortOrder.desc);
        this.order.push(newOrder);
        return this;
    };
    DbQuery.prototype.select = function () {
        var _a;
        var fields = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fields[_i] = arguments[_i];
        }
        (_a = this.selects).push.apply(_a, fields);
        return this;
    };
    DbQuery.prototype.include = function () {
        var _a;
        var includes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            includes[_i] = arguments[_i];
        }
        (_a = this.includes).push.apply(_a, includes);
        return this;
    };
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
    DbQuery.prototype.getFilterArray = function (list) {
        var array = [];
        list.forEach(function (condition) {
            var comparison = {};
            comparison[condition.operator] = condition.value;
            var or = {};
            if (condition.field)
                or[condition.field] = comparison;
            array.push(or);
        });
        return array;
    };
    DbQuery.prototype.getPrismaFindManyArg = function () {
        var prisma = {
            where: new PrismaWhere(),
            take: this.take
        };
        if (this.where.or.length > 0)
            prisma.where['OR'] = this.getFilterArray(this.where.or);
        if (this.where.and.length > 0)
            prisma.where['AND'] = this.getFilterArray(this.where.and);
        return prisma;
    };
    return DbQuery;
}());
exports.DbQuery = DbQuery;
var DbQueryTyped = /** @class */ (function (_super) {
    __extends(DbQueryTyped, _super);
    function DbQueryTyped(typeName, type) {
        var _this = _super.call(this) || this;
        _this.typeName = typeName;
        _this.type = type;
        return _this;
    }
    return DbQueryTyped;
}(DbQuery));
exports.DbQueryTyped = DbQueryTyped;
/**
 *  Typically used for updating object:
 *  Inp: partial object having an id and only those properties to update {id: 'abc', propToUpodate: 'update' }
 *  Out: the full object type to return
 */
var DbObject = /** @class */ (function () {
    /**
     *
     * @param typeName
     * @param type
     * @param object
     *
     */
    function DbObject(typeName, type, object) {
        this.typeName = typeName;
        this.type = type;
        this.object = object;
    }
    return DbObject;
}());
exports.DbObject = DbObject;
var DbObjectCreate = /** @class */ (function () {
    /**
     *
     * @param typeName
     * @param type
     * @param object
     *
     */
    function DbObjectCreate(typeName, type, object) {
        this.typeName = typeName;
        this.type = type;
        this.object = object;
    }
    return DbObjectCreate;
}());
exports.DbObjectCreate = DbObjectCreate;
"";
/**
 *  Typically used for updating objects:
 *  Inp: partial objects having an id and only those properties to update {id: 'abc', propToUpodate: 'update' }
 *  Out: the full object type to return
 */
var DbObjectMulti = /** @class */ (function () {
    function DbObjectMulti(typeName, type, objects) {
        this.typeName = typeName;
        this.type = type;
        this.objects = objects;
    }
    return DbObjectMulti;
}());
exports.DbObjectMulti = DbObjectMulti;
/**
 *  Typically used for inserting
 */
var DbObjectMultiCreate = /** @class */ (function (_super) {
    __extends(DbObjectMultiCreate, _super);
    function DbObjectMultiCreate(typeName, type, objects) {
        return _super.call(this, typeName, type, objects) || this;
    }
    return DbObjectMultiCreate;
}(DbObjectMulti));
exports.DbObjectMultiCreate = DbObjectMultiCreate;
