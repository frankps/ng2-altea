import * as dateFns from 'date-fns'
import { plainToInstance } from 'class-transformer';


export class YearMonth {
    /** year number in format yyyy */
    y: number

    /** month number from 1 to 12 */
    m: number

    constructor(year: number, month: number) {
        this.y = year
        this.m = month
    }

    static fromDateNumber(dateNum: number) : YearMonth {

        if (!dateNum)
            return null

        let date = DateHelper.parse(dateNum)

        let ym = new YearMonth(dateFns.getYear(date), dateFns.getMonth(date) + 1)


        return ym
    }

    static fromDate(date: Date) : YearMonth {

        if (!date)
            return null

        let ym = new YearMonth(dateFns.getYear(date), dateFns.getMonth(date) + 1)

        return ym
    }

    next(): YearMonth {

        let start = this.startDate()
        let startNextMonth = dateFns.addMonths(start, 1)

        return YearMonth.fromDate(startNextMonth)
    }

    previous(): YearMonth {

        let start = this.startDate()
        let startPreviousMonth = dateFns.subMonths(start, 1)

        return YearMonth.fromDate(startPreviousMonth)
    }

    startDate() : Date {
        let date = new Date(this.y, this.m - 1, 1)
        return date
    }

    endDate() : Date {
        let date = this.startDate()
        date = dateFns.addMonths(date, 1)
        return date
    }

    toString(): string {
        return `${this.y}.${this.m}`
    }

    /**
     * returns yearmonth in format yymm as number
     */
    toNumber() : number {
        let num = (this.y - 2000) * 100 + this.m
        return num
    }

    /**
     * 
     * @returns first day of next month in numeric date format most used (yyyyMMddhhmmss)
     */
    firstDayNextMonth(): number {

        let date = new Date(this.y, this.m - 1, 1)

        let firstDayNextMonth = dateFns.addMonths(date, 1)

        let toNum = DateHelper.yyyyMMdd000000(firstDayNextMonth)

        return toNum
    }
}

export class DateHelper {

    static dummy = 5

    static get minDate(): Date {
        return new Date(2000, 0, 1)
    }

    static get maxDate() {
        return new Date(2100, 0, 1)
    }   

    static isDate(input: any) {
        return input instanceof Date
    }

    static getUtcDate(date = new Date()) {

        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
            date.getUTCHours(), date.getUTCMinutes())

        return utcDate
    }

    

    /**
     * 
     * @param time time in format HH:mm
     * @param date 
     */
    static getDateAtTime(time: string, date = new Date()) : Date {

        if (!time || time.indexOf(':') == -1)
            return null

        let startOfDay = dateFns.startOfDay(date)

        let items = time.split(':')

        let hour = +items[0]
        let minutes = +items[1]

        let result = dateFns.addHours(startOfDay, hour)
        result = dateFns.addMinutes(result, minutes)

        return result
    }

    static getYearMonths(from: Date, to: Date): number[] {

        const yearMonths = []

        const startOfMonth = dateFns.startOfMonth(from)

        for (let date = startOfMonth; date <= to; date = dateFns.addMonths(date, 1)) {
            const yearMonth = DateHelper.yyyyMM(date)
            yearMonths.push(yearMonth)
        }

        return yearMonths   
    }

    /**
     * Returns date in format D/M HH:mm
     * @param date 
     * @returns 
     */
    static dateToString_DM_HHmm(date: Date): string {

        if (!date)
            return ''

        return dateFns.format(date, 'd/M HH:mm')

    }


    static getDayName(day: number) {

        switch (day) {
            case 0: return 'Su'
            case 1: return 'Mo'
            case 2: return 'Tu'
            case 3: return 'We'
            case 4: return 'Th'
            case 5: return 'Fr'
            case 6: return 'Sa'
        }

        return '??'
    }

    static getDayOfWeekNames(days: number[]) {

        if (!days || days.length == 0)
            return []

        const res : string[] = []

        days.forEach(day => {
            res.push(DateHelper.getDayName(day))
        })

        return res
    }


    /** return a number with components:
     *   yyyy: the last 2 digits of the current year
     *   MM: the month
     *   dd: the day
     *   hh: hour
     *   mm: minutes
     *   ss 
     */
    static yyyyMMddhhmmssiii(date: Date = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)
        const day = ("0" + (dateFns.getDate(date))).slice(-2)
        const hour = ("0" + (dateFns.getHours(date))).slice(-2)
        const min = ("0" + (dateFns.getMinutes(date))).slice(-2)
        const sec = ("0" + (dateFns.getSeconds(date))).slice(-2)
        const milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3)

        const res = `${year}${month}${day}${hour}${min}${sec}${milli}`
        return Number(res)

    }

    static yyyyMMddhhmmss(date: Date | null = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)
        const day = ("0" + (dateFns.getDate(date))).slice(-2)
        const hour = ("0" + (dateFns.getHours(date))).slice(-2)
        const min = ("0" + (dateFns.getMinutes(date))).slice(-2)
        const sec = ("0" + (dateFns.getSeconds(date))).slice(-2)
        //  const milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3)

        const res = `${year}${month}${day}${hour}${min}${sec}`
        return Number(res)

    }

    static yyyyMMdd000000(date: Date | null = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)
        const day = ("0" + (dateFns.getDate(date))).slice(-2)

        //  const milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3)

        const res = `${year}${month}${day}000000`
        return Number(res)

    }

    static yyyyMMddxxxxxx(date: Date | null = new Date(), xxxxxx: string = '235959'): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)
        const day = ("0" + (dateFns.getDate(date))).slice(-2)

        //  const milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3)

        const res = `${year}${month}${day}${xxxxxx}`
        return Number(res)
    }


    static yyyyMMddhhmm(date: Date = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)
        const day = ("0" + (dateFns.getDate(date))).slice(-2)
        const hour = ("0" + (dateFns.getHours(date))).slice(-2)
        const min = ("0" + (dateFns.getMinutes(date))).slice(-2)

        const res = `${year}${month}${day}${hour}${min}`

        return Number(res)

    }


    static yyyyMMdd(date: Date = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)
        const day = ("0" + (dateFns.getDate(date))).slice(-2)

        const res = `${year}${month}${day}`
        return Number(res)
    }

    static yyyyMM(date: Date = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2)

        const res = `${year}${month}`
        return Number(res)
    }

    static yyyyWW(date: Date = new Date()): number {
        if (!date)
            throw `Input is null or undefined`

        const year = dateFns.getYear(date)
        const week = ("0" + dateFns.getWeek(date)).slice(-2)

        const res = `${year}${week}`
        return Number(res)
    }



    /*
      wk.weekOfYear = dateFns.getWeek(weekDate)
      wk.month = dateFns.getMonth(weekDate) + 1
      wk.year = dateFns.getYear(weekDate)

      wk.id = wk.year * 100 + wk.weekOfYear
     */




    /** convert string or number in formats yyyyMMdd,yyyyMMddHHmm, yyyyMMddHHmmss to a date */
    static parse(input: any): Date {

        if (!input)
            return undefined //throw `Input is null or undefined`

        let stringDate = input

        if (Number.isInteger(input))
            stringDate = "" + input

        let date = null

        switch (stringDate.length) {
            case 8:
                date = dateFns.parse(stringDate, 'yyyyMMdd', new Date())
                break
            case 12:
                date = dateFns.parse(stringDate, 'yyyyMMddHHmm', new Date())
                break
            case 14:
                date = dateFns.parse(stringDate, 'yyyyMMddHHmmss', new Date())
                break
        }

        if (!date)
            throw `Could not parse date ${input}`

        return date
    }



    static yearWeek(date: Date | number, startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0): number {

        const weekOfYear = dateFns.getWeek(date, { weekStartsOn: startOfWeek })
        const year = dateFns.getYear(date)

        return year * 100 + weekOfYear

        /*    
            wk.weekOfYear = dateFns.getWeek(weekDate)
            wk.month = dateFns.getMonth(weekDate) + 1
            wk.year = dateFns.getYear(weekDate)
        */
    }


    /**
 * converts a date in number format 202106121030 (12 digits) into string format 2021-06-12T10:30
 * @param yyyyMMddHHmm 
 * @param suffix 
 * @returns 
 */
    static toDateTimeString(yyyyMMddHHmm: string | number, suffix = 'Z'): string {

        if (!yyyyMMddHHmm)
            throw `Input is null or undefined`

        const str = '' + yyyyMMddHHmm

        if (str.length != 12) {

            const msg = `Only possible for date strings with 12 digits ${yyyyMMddHHmm}`
            throw msg
        }

        const year = str.slice(0, 4)
        const month = str.slice(4, 6)
        const day = str.slice(6, 8)
        const hour = str.slice(8, 10)
        const minute = str.slice(10, 12)

        const result = `${year}-${month}-${day}T${hour}:${minute}${suffix}`



        return result
    }


    /** Format needed for Facebook interface */
    static unixTimestampSeconds(yyyyMMddHHmm: string | number, suffix = 'Z'): number {

        const utcString = DateHelper.toDateTimeString(yyyyMMddHHmm)

        const unixSeconds = Date.parse(utcString) / 1000

        return unixSeconds

    }



}

export class DateObject {
    year: number = 0
    month: number = 0
    day: number = 0

    static now(): DateObject {

        const date = new Date()

        const now = new DateObject()
        now.setDate(date)


        return now
    }

    static get zero(): DateObject {
        return new DateObject()
    }

    clone(): DateObject {
        const clone = new DateObject()

        clone.year = this.year
        clone.month = this.month
        clone.day = this.day

        return clone
    }

    setDate(date: Date) {

        this.year = date.getFullYear()
        this.month = date.getMonth() + 1
        this.day = date.getDate()    // getUTCDate()

    }

    static fromDate(date: Date): DateObject {

        const dateObj = new DateObject()
        dateObj.setDate(date)

        return dateObj;
    }



    static fromObject(obj: any): DateObject {

        const dateObj = new DateObject()

        dateObj.year = obj.year
        dateObj.month = obj.month
        dateObj.day = obj.day

        return dateObj;
    }


    static fromNumber(numDate: number): DateObject {

        if (!numDate)
            return DateObject.zero

        const str = numDate.toString()

        if (str.length !== 8)
            return DateObject.zero

        const objDate = DateObject.create(
            +str.substring(0, 4),
            +str.substring(4, 6),
            +str.substring(6, 8))

        return objDate
    }


    static create(year: number, month: number, day: number): DateObject {
        const date = new DateObject()

        date.year = year
        date.month = month
        date.day = day

        return date
    }

    toString() {
        return `${this.day}/${this.month}/${this.year.toString().slice(-2)}`
    }

    toIso() {
        return `${this.year.toString()}-${("0" + this.month).slice(-2)}-${("0" + this.day).slice(-2)}`
    }

    toNumber() {
        const str = this.year.toString() + ("0" + this.month).slice(-2) + ("0" + this.day).slice(-2)
        return +str;
    }

    toDate() {
        const date = new Date(this.year, this.month - 1, this.day)
        return date
    }

    addDays(amount: number) {

        const newDate = dateFns.addDays(this.toDate(), amount)

        this.setDate(newDate)

        return this
    }

    addMonths(amount: number) {

        const newDate = dateFns.addMonths(this.toDate(), amount)

        return DateObject.fromDate(newDate)
    }

    /**  option { weekStartsOn: 0 }    index of first day of the week (0 = Sunday) 
    */
    startOfWeek(options: any = null) {
        const newDate = dateFns.startOfWeek(this.toDate(), options)

        this.setDate(newDate)

        return this
    }


    /**  option { weekStartsOn: 0 }    index of first day of the week (0 = Sunday) 
    */
    endOfWeek(options: any = null) {
        const newDate = dateFns.endOfWeek(this.toDate(), options)

        this.setDate(newDate)

        return this
    }
}


export class DateConverter {

    /** The firestore Timestamp type is located in different libraries (Angular vs node):
     *    Angular: firestore.Timestamp      (import { firestore } from 'firebase';)
     *    node: admin.firestore.Timestamp   (import * as admin from 'firebase-admin';)
     *  therefor it needs to before using methods depending on it. 
    */
    static firestoreTimestampType: any

    static intToObject(intDate: number): DateObject {
        return DateObject.fromNumber(intDate)
    }

    static objectToInt(obj: any): number {
        const objDate = DateObject.fromObject(obj)
        return objDate.toNumber()
    }
    /*
        static timestampObjectToDate(value: object): Date | null {
    
            if (!value)
                return null
    
            if (value instanceof Date)
                return value
    
            // Parse dates represented as: "2014-01-01T23:28:56.782Z"
            if (typeof value === 'string' && value.length > 0 && value[value.length - 1] == 'Z') {
                const date = new Date(value)
                if (date)
                    return date
            }
    
            if (!DateConverter.firestoreTimestampType) {
                console.error('DateConverter.firestoreTimestampType not initialised: can not convert dates')
                console.log(value)
                return value
            }
    
            if (value && value.hasOwnProperty('nanoseconds')) {
    
                const ts: any = plainToInstance(DateConverter.firestoreTimestampType, value) //new firestore.Timestamp(value.seconds, value.nanoseconds)
                return ts.toDate()
            }
            else
                return value
        }
    */
}