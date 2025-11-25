import { plainToClass, instanceToPlain } from "class-transformer"
import * as _ from "lodash";
import { ArrayHelper } from "./array-helper";


export class StringHelper {

    static isNullOrUndefined(str): boolean {
        return str === undefined || str === null
    }

    static isDefined(str): boolean {
        return str !== undefined && str !== null
    }


    static isEmptyOrSpaces(str): boolean {
        return str === undefined || str === null || str.match(/^ *$/) !== null;
    }

    static isEmail(email: string): boolean {

        if (!email)
            return false

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static isMobileNumber(mobile: string): boolean {

        if (!mobile)
            return false

        return StringHelper.isDefined(mobile) && mobile.length >= 8
    }

    static toUrlSafe(str: string): string {
        return str
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')       // spaces → underscores
            .replace(/[^a-z0-9_-]/g, ''); // remove unsafe chars
    }

}



export class TypeHelper {

    static isNumber(value: any): boolean {
        return typeof value === "number";
    }

    static isDate(value: any): boolean {
        return value instanceof Date;
    }


}

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


    static isNullOrUndefined(obj): boolean {
        return obj === undefined || obj === null
    }

    static notNullOrUndefined(obj): boolean {
        return obj !== undefined && obj !== null
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


    /** https://www.30secondsofcode.org/js/s/stringify-circular-json/ */
    static stringifyCircularJSON(obj) {
        const seen = new WeakSet();
        return JSON.stringify(obj, (k, v) => {
            if (v !== null && typeof v === 'object') {
                if (seen.has(v)) return;
                seen.add(v);
            }
            return v;
        });
    };


    static createRandomNumberString(length, chars = "0123456789") {
        return ObjectHelper.createRandomString(length, chars)
    }

    static createRandomString(length, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {

        let doCrypto //= crypto


        try {
            doCrypto = typeof window !== 'undefined' ? (window.crypto) : null //(typeof require !== 'undefined' ? require('crypto') : null)
        } catch (e) {
            console.error(e)
        }




        if (!doCrypto)
            return ObjectHelper.generateRandomNumberString(length)

        // const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"  // "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        const randomArray = new Uint8Array(length);
        doCrypto.getRandomValues(randomArray);
        randomArray.forEach((number) => {
            result += chars[number % chars.length];
        });
        return result;
    }


    /**
 * Generates a random string of numbers with the specified length
 * Works in both Node.js and browser environments
 * 
 * @param {number} length - The length of the random number string to generate
 * @returns {string} A string of random numbers with the specified length
 */
    static generateRandomNumberString(length) {
        if (!Number.isInteger(length) || length <= 0) {
            throw new Error('Length must be a positive integer');
        }

        let result = '';

        // Method 1: Using Math.random (works in both Node.js and browser)
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }

        return result;
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


    static nextIdx(collection: any[], idxProperty: string = 'idx', idxStep = 100) {
        if (ArrayHelper.IsEmpty(collection))
            return idxStep

        const maxObject = _.maxBy(collection, idxProperty)

        return maxObject[idxProperty] + idxStep
    }

}