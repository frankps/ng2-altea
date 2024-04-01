import { Component } from '@angular/core';
import { Ngbs5FormGenerator } from '../../../../virtual-coder/src/lib/projects/altea/ngbs5-form-generator';
import { DbMethodsGenerator } from 'virtual-coder';

@Component({
    selector: 'app-ngbs5',
    templateUrl: './ngbs5.component.html',
    styleUrls: ['./ngbs5.component.scss']
})
export class Ngbs5Component {

/*     input = `    {
        "type": "dbMethods",
        "typeName": "bankTransaction",
        "plural": null
    }` */
    
    input = `{
    "type": "form",
    "name": "searchUser",
    "form": {
        "tag": true
    },
    "bind": {
        "mode": "ngModel",
        "to": "object",
        "type": "",
        "import": ""
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
        "type": {
            "type": "ng-select",
            "source": {
                "mode": "enum",
                "name": "ProductType",
                "import": "ts-altea-model",
                "translate": "enums.product-type"
            },
            "required": true,
            "clearable": false,
            "multiple": false
        },
        "sub": {
            "type": "ng-select",
            "source": {
                "mode": "enum",
                "name": "ProductSubType",
                "import": "ts-altea-model",
                "translate": "enums.product-sub-type"
            },
            "required": true,
            "clearable": false,
            "multiple": false
        },
        "search": {
            "type": "text",
            "required": true
        },       
        "request": {
            "type": "button",
            "translate": "dic.search",
            "click": "search($event)",
            "class": {
                "style": "primary",
                "outline": false,
                "size": "",
                "block": false
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

  test= {
    "type": "form",
    "name": "searchUser",
    "form": {
        "tag": true
    },
    "bind": {
        "mode": "ngModel",
        "to": "object",
        "type": "",
        "import": ""
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
        "type": {
            "type": "ng-select",
            "source": {
                "mode": "enum",
                "name": "ProductType",
                "import": "ts-altea-model",
                "translate": "enums.product-type"
            },
            "required": true,
            "clearable": false,
            "multiple": false
        },
        "sub": {
            "type": "ng-select",
            "source": {
                "mode": "enum",
                "name": "ProductSubType",
                "import": "ts-altea-model",
                "translate": "enums.product-sub-type"
            },
            "required": true,
            "clearable": false,
            "multiple": false
        },
        "search": {
            "type": "text",
            "required": true
        },       
        "request": {
            "type": "button",
            "translate": "dic.search",
            "click": "search($event)",
            "class": {
                "style": "primary",
                "outline": false,
                "size": "",
                "block": false
            },
            "disabled": {
                "enable": true,
                "pristine": true,
                "valid": false
            }
        }
    }
}
    /*
  
    {
        "type": "dbMethods",
        "typeName": "bankTransaction",
        "plural": null
    }


    {
      "type": "form",
      "name": "signIn",
      "form": {
          "tag": true
      },
      "bind": {
          "mode": "ngModel",
          "to": "login",
          "type": "SignIn",
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
          "type": {
              "type": "ng-select",
              "source": {
                  "mode": "enum",
                  "name": "ProductType",
                  "import": "ts-altea-model",
                  "translate": "enums.product-type"
              },
              "required": true,
              "clearable": false,
              "multiple": false
          },
          "email": {
              "type": "text",
              "required": true
          },
          "password": {
              "type": "password",
              "required": true
          },
         
          "request": {
              "type": "button",
              "translate": "dic.signIn",
              "click": "signIn($event)",
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
  
  
  
  
                    import { Output, EventEmitter } from '@angular/core';
                    @Output() redeem: EventEmitter<RedeemGift> = new EventEmitter<RedeemGift>()
                    this.redeem.emit(new RedeemGift(this.gift, GiftType.specific))
  
  
  
  
    "btn-primary float-end"
  
     "prep": {
              "type": "switch",
              "translate": ""
          },
          "prepOverlap": {
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

            case 'dbMethods':

                let dbMethodsGen = new DbMethodsGenerator(obj)
                this.code = dbMethodsGen.generate()

                break


        }

    }


}
