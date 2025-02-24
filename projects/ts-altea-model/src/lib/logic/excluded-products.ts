import { ArrayHelper } from "ts-common";
import { Product, Schedule } from "../schema";
import { BranchModeRange } from "./branch-mode";

export class ExcludedProducts {

    products: Product[] = []

    schedule: Schedule

    dateRange: BranchModeRange

    static empty = new ExcludedProducts()

    constructor(schedule?: Schedule, products?: Product[], dateRange?: BranchModeRange) {
        this.schedule = schedule
        this.products = products
        this.dateRange = dateRange
    }

    isEmpty() : boolean {
        return ArrayHelper.IsEmpty(this.products)
    }

    hasProducts() : boolean {
        return ArrayHelper.NotEmpty(this.products)
    }

    getProductNames() : string[] {

        if (ArrayHelper.IsEmpty(this.products))
            return []

        return this.products.map(p => p.name)
    }
}