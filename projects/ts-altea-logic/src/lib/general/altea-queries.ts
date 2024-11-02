import { ArrayHelper, DateHelper, DbQueryTyped, QueryOperator } from "ts-common";
import { OrderUi, PlanningType, Resource, ResourcePlanning, ResourcePlanningUi } from "ts-altea-model"

export class AlteaPlanningQueries {

    static absenceTypes() {
        return [PlanningType.hol, PlanningType.bnk, PlanningType.ill, PlanningType.abs, PlanningType.edu]
    }

    static availableTypes() {
        return [PlanningType.avl]
    }

    static extraTypes() {
        return [...this.absenceTypes(), ...this.availableTypes()]
    }


    static getByTypes(resourceIds: string[], from: Date, to: Date, types: PlanningType[], branchId?: string) : DbQueryTyped<ResourcePlanning> {
        const qry = new DbQueryTyped<ResourcePlanning>('resourcePlanning', ResourcePlanning)

        if (branchId)
            qry.and('branchId', QueryOperator.equals, branchId)

        qry.and('end', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(from))
        qry.and('start', QueryOperator.lessThanOrEqual, DateHelper.yyyyMMddhhmmss(to))
        qry.and('act', QueryOperator.equals, true)
        qry.and('resourceId', QueryOperator.in, resourceIds)
        qry.and('type', QueryOperator.in, types)
        qry.and('act', QueryOperator.equals, true)

        return qry
    }


}
