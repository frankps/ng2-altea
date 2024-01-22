import { Component, Input, OnInit } from '@angular/core';
import { Translation } from 'ts-common'
import { TranslationService } from '../../services/translation.service';



@Component({
  selector: 'ngx-altea-radio-list',
  templateUrl: './radio-list.component.html',
  styleUrls: ['./radio-list.component.scss'],
})
export class RadioListComponent implements OnInit {

  // _enum: any
  items: Translation[] = []
  model: any

  @Input() bindObject: any
  @Input() bindProp: any
  @Input() enum: any
  @Input() transPath?: string

  @Input() label = ''
  @Input() help = ''

  // @Input() set transPath(val: string) {  
  //   console.error(val)
  // }

  // @Input() set enum(val: any) {
  //   this._enum = val

  //   console.error(this._enum)
  // }




  constructor(private translationSvc: TranslationService) {


  }

  async ngOnInit() {


    console.error(this.bindObject[this.bindProp])

    if (this.enum && this.transPath) {

      await this.translationSvc.translateEnum(this.enum, this.transPath, this.items, false, true)

      console.warn(this.items)
    }

  }


}
