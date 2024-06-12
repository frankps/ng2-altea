import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as countryLib from 'country-list-js';
import ta from 'date-fns/locale/ta';
import { ObjectHelper } from 'ts-common';


@Component({
  selector: 'int-phone-edit',
  templateUrl: './int-phone-edit.component.html',
  styleUrls: ['./int-phone-edit.component.css']
})
export class IntPhoneEditComponent {

  _localNum: string

  @Input() css = {
    row: 'row mt-3',
    colPrefix: 'col-4',
    colLocalNum: 'col-8'
  }


  @Input() set phone(value: string) {

    console.log(value, this.countries)

    if (!value || value.trim().length == 0)
      return


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

  prefixChanged(event: any) {
    var fullNum = this.countryPrefix + this._localNum
    this.phoneChange.emit(fullNum)

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

      this.getFullNumber()
      

    }


  }

  getFullNumber() {

    this._localNum = this._localNum.replace(/^0+/, "")
    this._localNum = this._localNum.replace(/[^0-9]/g, "")

    var fullNum = this.countryPrefix + this._localNum

    this.phoneChange.emit(fullNum)

    return fullNum
  }

  async localPhoneChanged(event: KeyboardEvent) {
    const pattern = /[0-9]/;

    console.error(event)

    console.error(event.key)

    const inputChar = event.key
    console.error(inputChar)

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    } else {

      await this.sleep(200)
      this.getFullNumber()
      

    }
  }


  async onPaste(event) {

    console.log(event)



    await this.sleep(100)

    this.getFullNumber()
    console.log(this._localNum)
  }


}

/*
09/329.81.14

*/
