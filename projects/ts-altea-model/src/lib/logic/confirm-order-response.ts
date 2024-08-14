import { Order, ResourcePlanning } from "ts-altea-model"




export class ConfirmOrderResponse {

    // confirm-order-response
    order: Order

    plannings: ResourcePlanning[] = []

}


