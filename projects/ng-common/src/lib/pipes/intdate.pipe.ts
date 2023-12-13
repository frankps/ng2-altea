import { Pipe, PipeTransform } from '@angular/core';
import { DateHelper } from 'ts-common';
import * as dateFns from 'date-fns'

@Pipe({
  name: 'intdate'
})
export class IntdatePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    if (!value)
      return ''
    const date = DateHelper.parse(value)
    return date ? dateFns.format(date, 'dd/MM HH:mm') : ''
  }

}
