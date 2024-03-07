import { plainToClass, instanceToPlain } from "class-transformer"

export class ObjectHelper {

    /**
     * 
     * @param original 
     * @param type 
     */
    static clone(original: any, type: any): any {

        const unTypedClone = instanceToPlain(original)
        const typedClone = plainToClass(type, unTypedClone)

        return typedClone
    }

    /** before saving to the backend we want to remove linked objects (propsToRemove), we don't want to this on the original objects, but on a clone
     * => the original objects still have the linked objects
     */
    static unType(objects: any[], propsToRemove: string[]): any[] {

        if (!Array.isArray(objects))
            return []

        const unTypedObjects = objects.map(obj => {
            const unTyped = instanceToPlain(obj)

            propsToRemove.forEach(prop => {
                if (unTyped[prop])
                    delete unTyped[prop]
            })

            return unTyped
        })

        return unTypedObjects
    }


    static newSmallGuid(nrOfDigits = -1) {

        let pattern = ''

        if (nrOfDigits <= 0)
            pattern = 'xxxx-yxxx'
        else {

            for (let idx = 0; idx < nrOfDigits; idx++) {
                pattern += 'x'
            }

        }


        return pattern.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }


    /**
     * Firestore can't save objects with properties that have the value undefined. This method will replace undefined by null.
     * @param data The object to be checked for undefined values
     * @param template A template object can be passed: when undefined is found in data object, the corresponding value of the template object will be used as the new value
     * @param replaceUndefined 
     * @param isRecursion 
     */
    static replaceUndefinedProperties(data: any, template: any = null): any {

        if (!data)
            return data

        Object.keys(data).forEach(key => {

            const value = data[key]

            if (typeof value === 'undefined') {

                if (template && template[key])
                    data[key] = template[key]
                else
                    data[key] = null

                return
            }

            if (value && value instanceof Object)
                this.replaceUndefinedProperties(value, template)

        })

        return data
    }

    static extractArrayProperties(objects: any[], properties: string[]): any[] {

        if (!Array.isArray(objects) || objects.length == 0)
            return []


        return objects.map(obj => this.extractObjectProperties(obj, properties))
    }

    /** Return a sub object with only the specified properties */
    static extractObjectProperties(obj: any, properties: string[]) {
        if (!obj)
            return obj

        if (!Array.isArray(properties) || properties.length == 0)
            return []

        let newObj = {}

        for (let prop of properties) {
            newObj[prop] = obj[prop]
        }

        return newObj
    }


    /**
     * Removes a certain property in obj and in all sub-objects
     * @param obj 
     * @param propToRemove 
     * @returns 
     */
    static removeProperty(obj: any, propToRemove: string, recursive: boolean = true): any {

        if (!obj)
            return obj


        if (obj[propToRemove])
            delete obj[propToRemove]

        Object.entries(obj).forEach(([key, value]) => {

            if (!value)
                return

            if (recursive) {

                if (value instanceof Object)
                    this.removeProperty(value, propToRemove)

                if (Array.isArray(value))
                    value.forEach(sub => this.removeProperty(sub, propToRemove))


            }


        })


        return obj
    }

}