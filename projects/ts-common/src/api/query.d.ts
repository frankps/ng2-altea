export declare enum QueryOperator {
    contains = "contains",
    equals = "equals",
    startsWith = "startsWith",
    endsWith = "endsWith",
    greaterThanOrEqual = "gte",
    greaterThan = "gt",
    lessThanOrEqual = "lte",
    lessThan = "lt",
    in = "in"
}
export declare class QueryCondition {
    field?: string;
    operator: QueryOperator;
    value?: any;
    constructor(field?: string, operator?: QueryOperator, value?: any);
}
export declare class OrQuery {
    conditions: QueryCondition[];
}
export declare class AndQuery {
    conditions: QueryCondition[];
}
export declare enum SortOrder {
    asc = "asc",
    desc = "desc"
}
export declare class OrderByProperty {
    field?: string;
    order: SortOrder;
    constructor(field?: string, order?: SortOrder);
}
export declare class PrismaWhere {
    AND?: any[];
    OR?: any[];
}
export declare class DbQuery {
    where: {
        or: QueryCondition[];
        and: QueryCondition[];
    };
    take: number;
    order: OrderByProperty[];
    selects: string[];
    includes: string[];
    and(field: string, operator: QueryOperator, value?: any): void;
    or(field: string, operator: QueryOperator, value?: any): void;
    orderBy(field?: string, order?: SortOrder): void;
    select(...fields: string[]): void;
    include(...includes: string[]): void;
    getFilterArray(list: Array<QueryCondition>): any[];
    getPrismaFindManyArg(): {
        where: PrismaWhere;
        take: number;
    };
}
export declare class DbQueryTyped<T> extends DbQuery {
    typeName: string;
    type: {
        new (): T;
    };
    constructor(typeName: string, type: {
        new (): T;
    });
}
export declare class DbObject<T> {
    typeName: string;
    type: {
        new (): T;
    };
    object: T;
    constructor(typeName: string, type: {
        new (): T;
    }, object: T);
}
export declare class DbObjectMulti<T> {
    typeName: string;
    type: {
        new (): T;
    };
    objects: T[];
    constructor(typeName: string, type: {
        new (): T;
    }, objects: T[]);
}
