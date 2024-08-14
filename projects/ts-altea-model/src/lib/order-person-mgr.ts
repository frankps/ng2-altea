import { OrderPerson } from "ts-altea-model"

export class OrderPersonMgr {

    persons: OrderPerson[]

    constructor(persons: OrderPerson[]) {
        if (persons)
            this.persons = persons;
        else
            this.persons = [];
    }

    checkPersons(totalNrOfPersons: number) {
        if (this.persons.length < totalNrOfPersons)
            this.addPersons(totalNrOfPersons)
        else
            this.removePersons(totalNrOfPersons)
    }

    addPersons(totalNrOfPersons: number) {

        if (this.persons.length >= totalNrOfPersons)
            return; // no work to do, we already have persons

        for (let idx = this.persons.length; idx < totalNrOfPersons; idx++) {
            const personNum = idx + 1;

            const name = `Persoon ${personNum}`;

            const orderPerson = new OrderPerson('' + personNum, name)

            this.persons.push(orderPerson);
        }

    }
    removePersons(totalNrOfPersons: number) {
        if (this.persons.length <= totalNrOfPersons)
            return; // no work to do, we already have persons
        for (let idx = this.persons.length; idx > totalNrOfPersons; idx--) {
            this.persons.pop();
        }

    }



}