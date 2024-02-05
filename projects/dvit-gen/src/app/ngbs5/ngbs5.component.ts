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
    "name": "contact",
    "form": {
        "tag": true
    },
    "bind": {
        "mode": "ngModel",
        "to": "object",
        "type": "Product",
        "import": "ts-altea-model"
    },
    "label": {
        "mode": "ngx-altea-label-control",
        "translate": "objects.product"
    },
    "rows": {
        "generate": true,
        "cols": 1
    },
    "elements": {
        "bundle": {
            "type": "switch",
            "translate": ""
        },
        "country": {
            "type": "ng-select",
            "source": {
                "mode": "enum",
                "name": "Country",
                "import": "ts-altea-model",
                "translate": "enums.country"
            },
            "required": true,
            "clearable": false,
            "multiple": false
        },
        "first": {
            "type": "text",
            "required": true
        },
        "last": {
            "type": "text",
            "required": true
        },
        "email": {
            "type": "text",
            "required": true
        },
        "mobile": {
            "type": "text",
            "required": true
        },
        "news": {
            "type": "switch",
            "translate": ""
        },
        "request": {
            "type": "button",
            "translate": "dic.continue",
            "click": "confirm($event)",
            "class": {
                "style": "primary",
                "outline": false,
                "size": "",
                "block": true
            },
            "disabled": {
                "enable": true,
                "pristine": true,
                "valid": false
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
