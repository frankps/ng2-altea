
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


    static removeItems(source: string[], toRemove: string[]): string[] {
        if (ArrayHelper.IsEmpty(toRemove))
            return source

        //    let res = source.filter(item => toRemove.indexOf(item) == -1)

        let res = source.filter(item => {
           let idx = toRemove.indexOf(item) 
           
           return (idx == -1)
        })

        return res
    }
}