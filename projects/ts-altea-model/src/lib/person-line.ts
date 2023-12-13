import { OrderLine, OrderPerson } from "./altea-schema";


export class PersonLine {

    orderLineId?: string;
    personId?: string;
    descr?: string;
    orderLine?: OrderLine; // in order to show the details

}



