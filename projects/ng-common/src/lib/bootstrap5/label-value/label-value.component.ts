import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'ngx-altea-label-value',
  templateUrl: './label-value.component.html',
  styleUrls: ['./label-value.component.scss'],
})
export class LabelValueComponent {

  @Input() label = ''

  /** message that is shown when empty */
  @Input() empty = ''

  @Input() trans = true

  @Input() transform = ''


  _value = ''

  @Input() set value(val: any) {

    switch (this.transform) {
      case 'textToHtml':
        if (val)
          this._value = val.replace(/\n/g, '<br>')
        else
          this._value = ''
        break

      default:
        this._value = val
    }


    // this._value = val

  }

  get value() {
    return this._value
  }

  /** unit will be placed as suffix to the value */
  @Input() unit?: string

  @Input() class = ''

  /** Background color: default white */
  @Input() bgColor = '#FFFFFF'

  /** Background color: default black */
  @Input() fontColor = '#000000'


  @Input() max = 10

  icon = ''


  // @Input() list: CommonTs.List = null

  @Input() objects: unknown[] | null = null


  @Input() url = ''

  @Input() labelCol = 'col'
  @Input() valueCol = 'col'

  @Input() valueFormat = ''   // use 'pre' for pre-formatted text

  @Input() prefix = ''

  @Input() currency = ''
  
  prevListValue = ''
  prevListName = ''

  nameColClass() {
    return `${this.labelCol}`  //  d-flex justify-content-end
  }

  getYesNo() {

    if (this.value)
      return 'Yes'
    else
      return 'No'

  }

  colorStyle() {
    return `background-color: ${this.bgColor}; width: 100px; border-radius: 5px; color: ${this.fontColor}; text-align: center`
  }


  getArrayValue(): string {


    if (!this._value)
      return ''


    let val = ''

    if (Array.isArray(this._value))
      val = this._value.join(', ')
    else
      val = this._value

    return val

  }



  getValue() {

    if (this.value == null)
      return ''

    return this.value

    /*


    if (!this.list && !this.objects)
      return this.value
    else if (this.objects) {

      if (Array.isArray(this.value)) {

        let items = []
        for (let val of this.value) {

          let item = this.objects.find(obj => obj['id'] == val)

          if (item)
            items.push(item['name'])
          else
            items.push('??')

        }

        return items.join(', ')

      }



    } else if (this.list) {


      if (Array.isArray(this.value)) {

        let res = []
        this.value.map(v => this.list.getItem(v)).forEach(item => {
          if (item && item.name)
            res.push(item.name)
        })

        let val = res.join(', ')

        return val

      } else {

        // a simple caching mechanism, to quickly return
        if (this.value === this.prevListValue) {

          // console.log('Cached value...')
          return this.prevListName
        }

        let item = this.list.getItem(this.value)
        this.prevListValue = this.value

        if (item) {
          this.prevListName = item.name

          this.icon = item.icon
          return item.name
        }
        else {
          this.prevListName = ''
          return ''
        }
      }

    }
    //return 'List item'
    */

  }
}
