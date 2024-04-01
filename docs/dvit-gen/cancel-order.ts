

class cancelOrderUi {

   spec = {
        "type": "form",
        "name": "cancelOrder",
        "form": {
            "tag": true
        },
        "bind": {
            "mode": "ngModel",
            "to": "orderCancel",
            "type": "OrderCancel",
            "import": "ts-altea-model"
        },
        "label": {
            "mode": "ngx-altea-label-control",
            "translate": "objects.orderCancel"
        },
        "rows": {
            "generate": true,
            "cols": 1
        },
        "elements": {
            "compensation": {
                "type": "number",
                "required": false
            }    
        }
    }


    specAll = {
        "type": "form",
        "name": "cancelOrder",
        "form": {
            "tag": true
        },
        "bind": {
            "mode": "ngModel",
            "to": "orderCancel",
            "type": "OrderCancel",
            "import": "ts-altea-model"
        },
        "label": {
            "mode": "ngx-altea-label-control",
            "translate": "objects.orderCancel"
        },
        "rows": {
            "generate": true,
            "cols": 1
        },
        "elements": {
            "request": {
                "type": "button",
                "translate": "ui.order-cancel.cancelBtn",
                "click": "confirmCancel($event)",
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


    
    
    



}