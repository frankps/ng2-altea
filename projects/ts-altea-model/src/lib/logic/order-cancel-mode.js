"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCancelMode = exports.PaymentChange = exports.ObjectState = void 0;
var ObjectState;
(function (ObjectState) {
    ObjectState[ObjectState["active"] = 0] = "active";
    ObjectState[ObjectState["inactive"] = 1] = "inactive";
    ObjectState[ObjectState["softDelete"] = 2] = "softDelete";
    ObjectState[ObjectState["hardDelete"] = 3] = "hardDelete";
})(ObjectState || (exports.ObjectState = ObjectState = {}));
var PaymentChange;
(function (PaymentChange) {
    PaymentChange[PaymentChange["keep"] = 0] = "keep";
    PaymentChange[PaymentChange["convertToGift"] = 1] = "convertToGift";
})(PaymentChange || (exports.PaymentChange = PaymentChange = {}));
var OrderCancelMode = /** @class */ (function () {
    function OrderCancelMode() {
        this.order = ObjectState.inactive;
        this.payments = PaymentChange.keep;
        this.planning = ObjectState.inactive;
    }
    return OrderCancelMode;
}());
exports.OrderCancelMode = OrderCancelMode;
