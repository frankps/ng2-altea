import { Injectable } from '@angular/core';
import { Order } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DbQuery } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class OrderService extends BackendHttpServiceBase<Order> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Order, 'Order', sessionSvc.backend, sessionSvc.branchUnique + '/orders', http)
  }

  async pushOrderToFirebase(orderId: string) : Promise<any> {

    var res = await this.httpGet$(`pushOrderToFirebase?id=${orderId}`)
  
    return res
  }

  async deleteOrderInFirebase(branchId: string, orderId: string) : Promise<any> {

    var res = await this.httpGet$(`deleteOrderInFirebase?branchId=${branchId}&orderId=${orderId}`)
  
    return res
  }


  async pushTaskToFirebase(taskId: string) : Promise<any> {

    var res = await this.httpGet$(`pushTaskToFirebase?id=${taskId}`)
  
    return res
  }


  


}

