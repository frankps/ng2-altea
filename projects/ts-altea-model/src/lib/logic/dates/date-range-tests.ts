import { DateRange, DateRangeSet } from "ts-altea-model";



export class DateRangeTests {


    test1() {

        const day = 202411010000

        const set1 = DateRangeSet.init(day + 900, day + 1200, 2)
        const set2 = DateRangeSet.init(day + 900, day + 1200, 1)

        const res = set1.subtractMany(set2)

        console.log(res)
    }



    test2() {

        const day = 202411010000

        const set1 = DateRangeSet.init(day + 900, day + 1200, 1)
        set1.addRanges(DateRange.init(day + 1100, day + 1400, 1))
        
        const set2 = DateRangeSet.init(day + 1000, day + 1200, 1)

        const res = set1.subtractMany(set2)

        console.log(res)
    }


    unionTests() {

        const day = 202411010000
        const range1 = DateRange.init(day + 900, day + 1200)
        const range2 = DateRange.init(day + 1100, day + 1300)
        const range3 = DateRange.init(day + 800, day + 1000)
        const range4 = DateRange.init(day + 800, day + 1700)
        const range5 = DateRange.init(day + 1000, day + 1100)


        const rangeSet = new DateRangeSet([range1, range2, range3, range4, range5])

        const range11 = DateRange.init(day + 930, day + 1200)


        const toSubtractSet = new DateRangeSet([range11])

        var res = rangeSet.subtractMany(toSubtractSet)

        console.log(res)


         /* console.log(range1.section(range2))
        console.log(range1.section(range3))
        console.log(range1.section(range4)) 
        console.log(range3.section(range4)) */
        //dconsole.log(range1.section(range5)) 

    }


}
