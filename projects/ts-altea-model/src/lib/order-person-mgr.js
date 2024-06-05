"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPersonMgr = void 0;
var altea_schema_1 = require("./altea-schema");
var OrderPersonMgr = /** @class */ (function () {
    function OrderPersonMgr(persons) {
        if (persons)
            this.persons = persons;
        else
            this.persons = [];
    }
    OrderPersonMgr.prototype.checkPersons = function (totalNrOfPersons) {
        if (this.persons.length < totalNrOfPersons)
            this.addPersons(totalNrOfPersons);
        else
            this.removePersons(totalNrOfPersons);
    };
    OrderPersonMgr.prototype.addPersons = function (totalNrOfPersons) {
        if (this.persons.length >= totalNrOfPersons)
            return; // no work to do, we already have persons
        for (var idx = this.persons.length; idx < totalNrOfPersons; idx++) {
            var personNum = idx + 1;
            var name_1 = "Persoon ".concat(personNum);
            var orderPerson = new altea_schema_1.OrderPerson('' + personNum, name_1);
            this.persons.push(orderPerson);
        }
    };
    OrderPersonMgr.prototype.removePersons = function (totalNrOfPersons) {
        if (this.persons.length <= totalNrOfPersons)
            return; // no work to do, we already have persons
        for (var idx = this.persons.length; idx > totalNrOfPersons; idx--) {
            this.persons.pop();
        }
    };
    return OrderPersonMgr;
}());
exports.OrderPersonMgr = OrderPersonMgr;
