"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskHub = void 0;
var altea_db_1 = require("../general/altea-db");
var order_messaging_base_1 = require("../order/messaging/order-messaging-base");
var TaskHub = /** @class */ (function () {
    function TaskHub(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    Object.defineProperty(TaskHub.prototype, "MessagingTasks", {
        get: function () {
            if (!this.messagingTasks)
                this.messagingTasks = new order_messaging_base_1.OrderMessagingBase(this.alteaDb);
            return this.messagingTasks;
        },
        enumerable: false,
        configurable: true
    });
    return TaskHub;
}());
exports.TaskHub = TaskHub;
