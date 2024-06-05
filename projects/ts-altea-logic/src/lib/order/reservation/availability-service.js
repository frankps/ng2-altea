"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../../general/altea-db");
var create_resource_request_1 = require("./create-resource-request");
var create_availability_context_1 = require("./create-availability-context");
var slot_finder_1 = require("./slot-finder");
var resource_request_optimizer_1 = require("./resource-request-optimizer");
var determine_reservation_options_1 = require("./determine-reservation-options");
// import { ResourceAvailabilityCache } from './resource-availability-cache'
// export class OrderGetContext {
//     alteaDb: AlteaDb
//     constructor(protected db: IDb) {
//         this.alteaDb = new AlteaDb(db)
//     }
//     async process(order: Order): Promise<OrderContext> {
//         const ctx = new OrderContext(order)
//         if (order.lines) {
//             const productIds = order.lines.map(line => line.productId!).filter(id => typeof id !== "undefined" && id != null)
//             ctx.products = await this.alteaDb.getProducts(productIds)
//         }
//         return ctx
//     }
// }
var AvailabilityService = /** @class */ (function () {
    function AvailabilityService(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    AvailabilityService.prototype.testApi = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.alteaDb.testApi()];
            });
        });
    };
    AvailabilityService.prototype.process = function (availabilityRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var order, response, requestDate, createAvailabilityContext, availabilityCtx, availability2, createResourceRequest, initialResourceRequests, optimizedRequests;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        console.error('OrderGetPossibleDates.process()', availabilityRequest);
                        order = availabilityRequest.order;
                        response = new ts_altea_model_1.AvailabilityResponse();
                        requestDate = new Date();
                        createAvailabilityContext = new create_availability_context_1.CreateAvailabilityContext(this.alteaDb);
                        return [4 /*yield*/, createAvailabilityContext.create(availabilityRequest)];
                    case 1:
                        availabilityCtx = _e.sent();
                        if (availabilityRequest.debug)
                            response.debug.ctx = availabilityCtx;
                        availability2 = new ts_altea_model_1.ResourceAvailability2(availabilityCtx);
                        if (availabilityRequest.debug)
                            response.debug.availability = availability2;
                        createResourceRequest = new create_resource_request_1.CreateResourceRequest(this.alteaDb);
                        initialResourceRequests = createResourceRequest.create(availabilityCtx);
                        if (availabilityRequest.debug)
                            (_a = response.debug.resourceRequests).push.apply(_a, initialResourceRequests);
                        optimizedRequests = (_b = resource_request_optimizer_1.ResourceRequestOptimizer.I).optimize.apply(_b, initialResourceRequests);
                        if (availabilityRequest.debug)
                            (_c = response.debug.resourceRequests).push.apply(_c, optimizedRequests);
                        /** Look for possibilities: first we try to find solutions for the optimized resource request,
                         *  if no solutions found, we try the original resourceRequest
                         *
                         */
                        response.solutionSet = (_d = slot_finder_1.SlotFinder.I).findSlots.apply(_d, __spreadArray([availability2, availabilityCtx], initialResourceRequests, false));
                        // response.solutionSet = SlotFinder.I.findSlots(availability, availabilityCtx, ...optimizedRequests)
                        response.optionSet = determine_reservation_options_1.DetermineReservationOptions.I.getAllReservationOptions(response.solutionSet);
                        console.error(response.optionSet);
                        return [2 /*return*/, response];
                }
            });
        });
    };
    return AvailabilityService;
}());
exports.AvailabilityService = AvailabilityService;
