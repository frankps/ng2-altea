import { Component } from '@angular/core';
import { Ngbs5FormGenerator } from './ngbs5-form-generator';

@Component({
  selector: 'app-ngbs5',
  templateUrl: './ngbs5.component.html',
  styleUrls: ['./ngbs5.component.scss']
})
export class Ngbs5Component {

  input = `{
    "type": "form",
    "info": "Setup recurring tasks",
    "name": "recurring-task",
    "form": { "tag": true },
    "bind": { "mode": "ngModel", "to": "recurTask", "type": "RecurringTask", "import": "ts-altea-model" },
    "label": { "mode": "ngx-altea-label-control", "translate": "objects.task"},
    "rows": { "generate": true, "cols": 1 },
    "elements": {
        "name": {
            "type": "text",
            "required": true,
            "translate": ""
        },
        "loc": {
            "type": "text",
            "required": false,
            "translate": ""
        },
        "info": {
            "type": "textarea",
            "required": false,
            "translate": ""
        },
        "schedule": {
            "type": "ng-select",
            "source": { "mode": "enum", "name": "TaskSchedule", "import": "ts-altea-model", "translate": "enums.task-schedule" },
            "required": true,
            "clearable": false,
            "multiple": false,
            "translate": ""
        },
        "prio": {
          "type": "ng-select",
          "source": { "mode": "enum", "name": "TaskPriority", "import": "ts-altea-model", "translate": "enums.task-priority" },
          "required": true,
          "clearable": false,
          "multiple": false,
          "translate": ""
      },
        "save": {
            "type": "button",
            "translate": "dic.save",
            "click": "save(recurTask)",
            "eventEmitter": { "enable": true, "name": "change", "type": "", "import": "", "value": "" },
            "class": { "style": "primary", "outline": false, "size": "", "block": true } ,
            "disabled": { "enable": true, "pristine": true, "valid": false },
            "help": {
              "eventEmitter": [
                "When type, import & value are blank, then we take this data from the bind property."
              ]
            } 
        }
    }
}
  `

  /*

                  import { Output, EventEmitter } from '@angular/core';
                  @Output() redeem: EventEmitter<RedeemGift> = new EventEmitter<RedeemGift>()
                  this.redeem.emit(new RedeemGift(this.gift, GiftType.specific))




  "btn-primary float-end"


        "country": {
          "type": "ng-select",
          "source": { "mode": "enum", "name": "Country", "import": "ts-altea-model", "translate": "enums.country" },
          "required": true,
          "clearable": false,
          "multiple": false
      },


  */


  html = ''
  code = ''

  generate() {

    const obj = JSON.parse(this.input)
    console.error(obj)

    switch (obj.type) {

      case 'form':
        let formGen = new Ngbs5FormGenerator(obj)
        let ngComponent = formGen.generate()

        if (ngComponent) {
          this.html = ngComponent.html.toString()
          this.code = ngComponent.code.toString()
        }
        else {
          this.html = ''
          this.code = ''
        }

        break


    }

  }


}
