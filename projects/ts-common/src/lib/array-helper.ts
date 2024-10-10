
export class ArrayHelper {
    static AtLeastOneItem(array: any): boolean {
        return (Array.isArray(array) && array.length > 0)
    }

    static NotEmpty(array: any): boolean {
        return (Array.isArray(array) && array.length > 0)
    }

    static IsEmpty(array: any): boolean {
        return (!Array.isArray(array) || array.length == 0)
    }
}