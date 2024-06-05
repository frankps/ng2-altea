"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderReminders = void 0;
var altea_db_1 = require("../../general/altea-db");
var order_messaging_base_1 = require("./order-messaging-base");
var OrderReminders = /** @class */ (function () {
    function OrderReminders(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
        this.orderMessaging = new order_messaging_base_1.OrderMessagingBase(this.alteaDb);
    }
    return OrderReminders;
}());
exports.OrderReminders = OrderReminders;
