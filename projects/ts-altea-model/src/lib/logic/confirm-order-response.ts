import { Order, ResourcePlanning } from "../altea-schema";




export class ConfirmOrderResponse {

    // confirm-order-response
    order: Order

    plannings: ResourcePlanning[] = []

}


