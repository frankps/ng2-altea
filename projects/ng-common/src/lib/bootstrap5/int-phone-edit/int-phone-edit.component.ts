import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import * as countryLib from 'country-list-js';
import ta from 'date-fns/locale/ta';
import { ObjectHelper } from 'ts-common';
import { AbstractControl, Validator, NG_VALIDATORS, NgForm } from '@angular/forms';

export class CountryPhoneSpec {
  regEx: string
  length: { min, max }
}

@Component({
  selector: 'int-phone-edit',
  templateUrl: './int-phone-edit.component.html',
  styleUrls: ['./int-phone-edit.component.css'],

})
export class IntPhoneEditComponent {

  // https://en.wikipedia.org/wiki/List_of_mobile_telephone_prefixes_by_country
  countrySpecs = new Map<string, CountryPhoneSpec>([

    ['31', { regEx: '^(6)[0-9]*', length: { min: 9, max: 9 } }],
    ['32', { regEx: '^(455|456|46|47|48|49)[0-9]*', length: { min: 9, max: 9 } }],
    ['33', { regEx: '^(6|7)[0-9]*', length: { min: 9, max: 9 } }],  // France
    ['34', { regEx: '^(6|7)[0-9]*', length: { min: 9, max: 9 } }],  // Spain
    ['44', { regEx: '^(7)[0-9]*', length: { min: 10, max: 10 } }],  // UK
    ['49', { regEx: '^(15|16|17)[0-9]*', length: { min: 10, max: 11 } }],  // Germany
  ])


  @Input() required: boolean = true

  /*
  {
    32: {
      re: '^(455|456|460|465|466|467|468|47|48|49)[0-9]*',
      length: { min: 9, max: 9 }
    },
    31: {
      re: '^(6)[0-9]*',
      length: { min: 9, max: 9 }
    }
  }*/

  @ViewChild('phoneForm')
  phoneForm: NgForm

  /*   @ViewChild('mobileInput')
    mobileInput: ElementRef */

  _localNum: string

  @Input() css = {
    row: 'row mt-3',
    colPrefix: 'col-4',
    colLocalNum: 'col-8'
  }


  @Input() set phone(value: string) {

    console.log(value, this.countries)

    if (!value || value.trim().length == 0) {
      this._localNum = ''
      return
    }
      


    let phone = value.trim()

    if (phone.startsWith('+'))
      phone = phone.substring(1)

    let phoneCountry = null

    for (let country of this.countries) {
      if (phone.startsWith(country.prefix)) {
        phoneCountry = country
        break
      }
    }

    if (phoneCountry) {
      this.countryPrefix = phoneCountry.prefix
      phone = phone.replace(phoneCountry.prefix, '')
    }

    this._localNum = phone


  }

  @Output() phoneChange = new EventEmitter<string>();

  countries: any[] = []
  countryPrefix: any = '32'

  constructor() {
    this.loadCountries()
  }


  loadCountries() {

    this.countries = Object.values(countryLib.all)

    this.countries = this.countries.filter(ctr => ctr?.dialing_code && ctr?.dialing_code.length > 0).map(ctr => ({ prefix: ctr['dialing_code'], label: `${ctr['iso2']}: +${ctr['dialing_code']}` }))

    console.log("    COUNTRIES ---->", this.countries)
    /*
    var cty = country.findByIso2('BE')
    console.error(cty)

    console.error(country.all)
*/
  }

  emitPhoneChangedEvent(): string {
    this.cleanLocalNum()
    var fullNum = this.countryPrefix + this._localNum

    if (this.checkPhone())
      this.phoneChange.emit(fullNum)
    else
      this.phoneChange.emit(null)

    return fullNum
  }

  phoneChanged() {
    this.emitPhoneChangedEvent()
  }

  prefixChanged(event: any) {

    this.emitPhoneChangedEvent()

  }


  async sleep(ms: number): Promise<void> {
    return new Promise(
      (resolve) => setTimeout(resolve, ms));
  }

  async specialKeyPressed(event: KeyboardEvent) {
    const inputChar = event.key?.toLowerCase()

    if (inputChar == 'backspace' || inputChar == 'delete') {
      console.log(inputChar)

      await this.sleep(200)

      this.emitPhoneChangedEvent()
    }
  }

  cleanLocalNum() {

    this._localNum = this._localNum.replace(/^0+/, "")
    this._localNum = this._localNum.replace(/[^0-9]/g, "")
  }

  /*
    getFullNumber(): string {
  
      this.cleanLocalNum()
  
      var fullNum = this.countryPrefix + this._localNum
  
      this.phoneChange.emit(fullNum)
  
      return fullNum
    }
  */
  async localPhoneChanged(event: KeyboardEvent) {
    const pattern = /[0-9]/;


    /*
    console.error(this.mobileInput)

    let nativeElement : HTMLInputElement = this.mobileInput.nativeElement

    console.error(nativeElement)
    */



    console.error(event.key)

    const inputChar = event.key
    console.error(inputChar)

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    } else {

      await this.sleep(200)
      this.emitPhoneChangedEvent()


    }

  //  this.checkPhone()

  }




  checkPhone() {
    // https://stackoverflow.com/questions/43553544/how-can-i-manually-set-an-angular-form-field-as-invalid

    let ok = true
    //var reg = new RegExp('^[0-9]$');
    if (this._localNum == null || this._localNum == undefined) {
      this._localNum = ""
      ok = false
    }
    const countrySpec = this.countrySpecs.get(this.countryPrefix)

    if (!countrySpec) {
      console.error('NO COUNTRY SPEC')
      return this.setErrors()
    }
    else
      console.warn(countrySpec)


    this.cleanLocalNum()

    const length = this._localNum.length
    if (length < countrySpec.length.min || length > countrySpec.length.max) {
      console.warn(`Phone wrong length`)
      return this.setErrors()
    }


    var reg = new RegExp(countrySpec.regEx)
    ok = reg.test(this._localNum)


    return this.setErrors(ok)

  }

  setErrors(ok: boolean = false) {

    if (ok)
      this.phoneForm.controls['mobile'].setErrors(null)
    else
      this.phoneForm.controls['mobile'].setErrors({ 'incorrect': true })

    return ok
  }

  isValid() {


    return this.phoneForm ? this.phoneForm.valid : false
  }




  async onPaste(event) {

    console.log(event)



    await this.sleep(100)

    this.emitPhoneChangedEvent()
    console.log(this._localNum)

    this.checkPhone()

  }


}

/*
09/329.81.14

*/
