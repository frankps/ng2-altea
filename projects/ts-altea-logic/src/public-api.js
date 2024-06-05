"use strict";
/*
 * Public API Surface of ts-altea-logic
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./lib/ts-altea-logic"), exports);
__exportStar(require("./lib/general/altea-db"), exports);
__exportStar(require("./lib/interface"), exports);
__exportStar(require("./lib/interfaces/i-db"), exports);
__exportStar(require("./lib/order/reservation/availability-service"), exports);
__exportStar(require("./lib/order/order-mgmt-service"), exports);
__exportStar(require("./lib/order/reservation/create-resource-request"), exports);
__exportStar(require("./lib/order/deposit/check-deposits"), exports);
__exportStar(require("./lib/task/task-scheduling-service"), exports);
__exportStar(require("./lib/order"), exports);
