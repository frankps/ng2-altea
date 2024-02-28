import { Resource, ResourceType } from "../altea-schema"
import * as _ from "lodash"

export class ResourceSet {

    constructor(public resources: Resource[] = []) {

    }

    static get empty() {
        return new ResourceSet()
    }


    isEmpty(): boolean {
        return (!Array.isArray(this.resources) || this.resources.length === 0)
    }

    clear() {
        this.resources = []
    }

    add(...resources: Resource[]) {
        this.resources.push(...resources)
    }

    replaceGroupsByChildren(): ResourceSet {

        if (!Array.isArray(this.resources) || this.resources.length == 0)
            return ResourceSet.empty

        const result = ResourceSet.empty

        for (const resource of this.resources) {

            if (!resource.isGroup)
                result.add(resource)
            else
                result.add(...resource.getChildResources())

        }

        return result
    }

    filterByType(type: ResourceType): ResourceSet {

        const filtered = this.resources.filter(r => r.type == type)

        return new ResourceSet(filtered)
    }

    static intersectionMulti(sets: ResourceSet[]): ResourceSet {

        return sets.reduce((a, b) => ResourceSet.intersection(a, b))
    }

    /** the intersection of resources between 2 sets */
    static intersection(set1: ResourceSet, set2: ResourceSet): ResourceSet {

        if (!set1 || !set2 || !Array.isArray(set1.resources) || !Array.isArray(set2.resources))
            return ResourceSet.empty

        const intersection = _.intersectionBy(set1.resources, set2.resources, 'id')

        return new ResourceSet(intersection)
    }

    /** the intersection of resources between 2 sets */
    static intersectionOfArrays(set1: Resource[], set2: Resource[]): Resource[] {
        if (!Array.isArray(set1) || !Array.isArray(set2))
            return []

        const intersection = _.intersectionBy(set1, set2, 'id')
        return intersection
    }




}