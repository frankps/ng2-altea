import * as _ from "lodash";

// "use allowSyntheticDefaultImports"
//import {default as currency} from 'currency.js';
//import * as currency from 'currency.js'
//import currency = require('currency.js')   
//import currency from 'currency.js';
// added to tsconfig: "allowSyntheticDefaultImports": true
   
// https://github.com/scurker/currency.js/issues/73
     

export class NumberHelper {

    static round(num: number) : number {
        //  return +(Math.round(number + "e+2") + "e-2");

       // let rounded = currency(num).value
    
        return _.round(num, 2)
    
      }  
    
}
