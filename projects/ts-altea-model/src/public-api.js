"use strict";
/*
 * Public API Surface of ts-altea-model
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
__exportStar(require("./lib/ts-altea-model"), exports);
__exportStar(require("./lib/bank-transaction"), exports);
//export * from './lib/_order-context'
__exportStar(require("./lib/order-person-mgr"), exports);
__exportStar(require("./lib/person-line"), exports);
__exportStar(require("./lib/offer"), exports);
__exportStar(require("./lib/altea-schema"), exports);
__exportStar(require("./lib/general"), exports);
__exportStar(require("./lib/logic"), exports);
__exportStar(require("./lib/stripe"), exports);
__exportStar(require("./lib/messaging"), exports);
__exportStar(require("./lib/local"), exports);
