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
    "info": "Only used internally. To link a contact (customer) to an order. Search contact or send proposal to customer.",
    "name": "offer",
    "form": { "tag": true },
    "bind": { "mode": "ngModel", "to": "offer", "type": "Offer", "import": "ts-altea-model" },
    "label": { "mode": "ngx-altea-label-control", "translate": "ui.order-mgr.offer"},
    "rows": { "generate": true, "cols": 1 },
    "elements": {
        "mobile": {
            "type": "text",
            "required": false,
            "translate": "dic.mobile"
        },
        "email": {
            "type": "text",
            "required": false,
            "translate": "dic.email"
        },
        "validity": {
            "type": "ng-select",
            "source": { "mode": "enum", "name": "Country", "import": "ts-altea-model", "translate": "enums.country" },
            "required": true,
            "clearable": false,
            "multiple": false,
            "translate": ""
        },
        "sendOffer": {
            "type": "button",
            "translate": ".send",
            "click": "sendOffer($event)",
            "class": { "style": "primary", "outline": false, "size": "", "block": true } ,
            "disabled": { "enable": true, "pristine": true, "valid": false }
        }
    }
}
  `

  /*

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
