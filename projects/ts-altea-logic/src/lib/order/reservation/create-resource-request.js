"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateResourceRequest = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../../general/altea-db");
var _ = require("lodash");
var CreateResourceRequest = /** @class */ (function () {
    function CreateResourceRequest(db) {
        this.db = db;
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    CreateResourceRequest.prototype.create = function (availabilityCtx) {
        console.error('CreateResourceRequest');
        var order = availabilityCtx.order;
        if (!order || !order.lines)
            return [];
        var orderlinesWithPlanning = order.linesWithPlanning();
        if (orderlinesWithPlanning.length == 0)
            return [];
        var persons = [];
        if (order.hasPersons())
            persons.push.apply(persons, order.persons);
        else // if no persons are specified, then we assume order is just for 1 person named 'default'
            persons.push(new ts_altea_model_1.OrderPerson('default', 'default'));
        var scheduleIds = this.getScheduleIds(orderlinesWithPlanning);
        if (scheduleIds.length == 0)
            scheduleIds.push(''); // we can push anything, just to make sure the for loop below is executed once
        console.warn('scheduleIds', scheduleIds);
        var requests = [];
        for (var _i = 0, scheduleIds_1 = scheduleIds; _i < scheduleIds_1.length; _i++) {
            var scheduleId = scheduleIds_1[_i];
            var schedule = availabilityCtx.getSchedule(scheduleId);
            var request = this.createResourceRequest(schedule, persons, orderlinesWithPlanning, availabilityCtx);
            request.branchId = availabilityCtx.branchId;
            requests.push(request);
        }
        return requests;
    };
    CreateResourceRequest.prototype.createResourceRequest = function (schedule, persons, orderLines, availabilityCtx) {
        var resourceRequest = new ts_altea_model_1.ResourceRequest("Initial resource request");
        resourceRequest.persons = persons;
        resourceRequest.schedule = schedule;
        var offsetPerPerson = new Map();
        for (var _i = 0, persons_1 = persons; _i < persons_1.length; _i++) {
            var person = persons_1[_i];
            offsetPerPerson.set(person.id, ts_altea_model_1.TimeSpan.zero);
        }
        for (var _a = 0, orderLines_1 = orderLines; _a < orderLines_1.length; _a++) {
            var orderLine = orderLines_1[_a];
            var product = orderLine.product;
            var productResources = void 0;
            if (schedule === null || schedule === void 0 ? void 0 : schedule.id)
                productResources = product.getResourcesForSchedule(schedule.id); //product.resources
            else
                productResources = product.resources;
            if (!productResources)
                continue; // should not happen
            var orderLinePersonIds = orderLine.hasPersons() ? orderLine.persons : [persons[0].id]; // fall back to 1st specified person id
            // most of the time there will be only 1 personId
            for (var _b = 0, orderLinePersonIds_1 = orderLinePersonIds; _b < orderLinePersonIds_1.length; _b++) {
                var personId = orderLinePersonIds_1[_b];
                var personOffset = offsetPerPerson.get(personId);
                var personOffsetToAdd = ts_altea_model_1.TimeSpan.zero;
                for (var _c = 0, productResources_1 = productResources; _c < productResources_1.length; _c++) {
                    var productResource = productResources_1[_c];
                    var resource = availabilityCtx.getResource(productResource.resourceId);
                    if (!resource)
                        continue;
                    var offsetDuration = this.getDuration(orderLine, product, productResource);
                    var resReqItem = new ts_altea_model_1.ResourceRequestItem(orderLine, product, resource.type);
                    if (!resource) // not sure if this is needed
                        resource = productResource.resource;
                    if (resource.isGroup) {
                        resReqItem.resourceGroup = resource;
                        resReqItem.addResources(resource.getChildResources());
                    }
                    else
                        resReqItem.addResource(resource ? resource : productResource.resource);
                    resReqItem.personId = personId;
                    resReqItem.duration = offsetDuration.duration;
                    var offset = personOffset.clone();
                    resReqItem.offset = offset.add(offsetDuration.offset);
                    resReqItem.qty = productResource.groupQty;
                    resReqItem.isPrepTime = productResource.prep;
                    resReqItem.prepOverlap = productResource.prepOverlap;
                    resReqItem.productResource = productResource;
                    resourceRequest.add(resReqItem);
                    // at the end we will increment 
                    if (offsetDuration.duration.seconds > personOffsetToAdd.seconds)
                        personOffsetToAdd.seconds = offsetDuration.duration.seconds;
                }
                personOffset.addInternal(personOffsetToAdd);
            }
            console.error(orderLine);
        }
        return resourceRequest;
    };
    CreateResourceRequest.prototype.getScheduleIds = function (orderLines) {
        if (!orderLines || orderLines.length == 0)
            return [];
        var scheduleIds = [];
        for (var _i = 0, orderLines_2 = orderLines; _i < orderLines_2.length; _i++) {
            var orderLine = orderLines_2[_i];
            var product = orderLine.product;
            var productResources = product.resources;
            if (!productResources)
                continue;
            for (var _a = 0, productResources_2 = productResources; _a < productResources_2.length; _a++) {
                var productResource = productResources_2[_a];
                if (!productResource.scheduleIds)
                    continue;
                for (var _b = 0, _c = productResource.scheduleIds; _b < _c.length; _b++) {
                    var scheduleId = _c[_b];
                    if (scheduleId && scheduleIds.indexOf(scheduleId) == -1)
                        scheduleIds.push(scheduleId);
                }
            }
        }
        return scheduleIds;
    };
    CreateResourceRequest.prototype.getDuration = function (line, product, productResource) {
        var offsetDuration = new ts_altea_model_1.OffsetDuration();
        var productDuration = ts_altea_model_1.TimeSpan.zero;
        productDuration.addMinutes(product.duration);
        var optionValues = line.allOptionValues();
        var optionDuration = _.sumBy(optionValues, 'dur');
        productDuration.addMinutes(optionDuration);
        var duration = ts_altea_model_1.TimeSpan.zero;
        switch (productResource.durationMode) {
            case ts_altea_model_1.DurationMode.product:
                duration = duration.add(productDuration);
                break;
            case ts_altea_model_1.DurationMode.custom:
                duration.addMinutes(productResource.duration);
                if (productResource.reference == ts_altea_model_1.DurationReference.end)
                    offsetDuration.offset = offsetDuration.offset.add(productDuration);
                if (productResource.offset)
                    offsetDuration.offset.addMinutes(productResource.offset);
                break;
        }
        offsetDuration.duration = duration;
        // if (productResource.durationMode == DurationMode.product) {
        // }
        return offsetDuration;
    };
    return CreateResourceRequest;
}());
exports.CreateResourceRequest = CreateResourceRequest;
