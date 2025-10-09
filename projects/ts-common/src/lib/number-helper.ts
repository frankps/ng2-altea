import * as _ from "lodash";

// "use allowSyntheticDefaultImports"
//import {default as currency} from 'currency.js';
//import * as currency from 'currency.js'
//import currency = require('currency.js')   
//import currency from 'currency.js';
// added to tsconfig: "allowSyntheticDefaultImports": true

// https://github.com/scurker/currency.js/issues/73


export class NumberHelper {

  static round(num: number): number {
    //  return +(Math.round(number + "e+2") + "e-2");

    // let rounded = currency(num).value

    return _.round(num, 2)

  }

  static isNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  static intl = new Intl.NumberFormat("nl-BE", {   //"nl-BE"
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Formats numbers for CSV with , as decimal and no thousands separator
  static toCsvNumber(value: number, decimals = 2): string {
    return NumberHelper.intl.format(value);
  }

}
