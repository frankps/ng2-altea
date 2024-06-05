"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCheckoutSession = void 0;
var CreateCheckoutSession = /** @class */ (function () {
    function CreateCheckoutSession(amount, currency, description, embedded) {
        if (embedded === void 0) { embedded = true; }
        this.amount = amount;
        this.currency = currency;
        this.description = description;
        this.embedded = embedded;
        this.test = true;
        this.methodTypes = ['card', 'bancontact'];
    }
    CreateCheckoutSession.embedded = function (amount, currency, description, returnUrl) {
        var session = new CreateCheckoutSession(amount, currency, description);
        session.returnUrl = returnUrl;
        return session;
    };
    return CreateCheckoutSession;
}());
exports.CreateCheckoutSession = CreateCheckoutSession;
