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
    "bind": { "mode": "ngModel", "to": "obj" },
    "label": { "mode": "ngx-altea-label-control", "translate": "objects.invoice"},
    "rows": { "generate": true, "cols": 1 },
    "elements": {
        "country": {
          "type": "ng-select",
          "source": { "mode": "enum", "name": "Country" },
          "required": true,
          "clearable": false,
          "multiple": false
      },
        "company": {
            "type": "text",
            "required": true
        },
        "vat": {
            "type": "text",
            "required": false
        },
        "address": {
            "type": "textarea",
            "required": true,
            "rows": 4
        },
        "request": {
            "type": "button",
            "translate": "dic.add",
            "click": "test($event)"
        }
    }
}
  `

  html = ''


  generate() {

    const obj = JSON.parse(this.input)
    console.error(obj)

    switch (obj.type) {

      case 'form':
        let formGen = new Ngbs5FormGenerator(obj)
        let htmlDoc = formGen.generate()

        if (htmlDoc)
          this.html = htmlDoc.toString()
        else
          this.html = ''

        break


    }

  }


}
