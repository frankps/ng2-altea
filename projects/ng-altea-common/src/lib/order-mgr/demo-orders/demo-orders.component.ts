import { Component, Output, EventEmitter } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { SessionService } from 'ng-altea-common';
import { Order, ResourceType } from 'ts-altea-model';
import { DashboardService, ToastType } from 'ng-common'

export class DemoOrderLine {
  // productId: string

  constructor(public productId: string, public qty = 1) {

  }
}

export class DemoOrder {
  lines: DemoOrderLine[] = []

  static new(productId: string, qty = 1): DemoOrder {
    const order = new DemoOrder()

    const line = new DemoOrderLine(productId, qty)
    order.lines.push(line)

    return order
  }

  static fromProducts(...productIds: string[]): DemoOrder {

    const order = new DemoOrder()

    for (const productId of productIds) {
      order.lines.push(new DemoOrderLine(productId))
    }

    // productIds.forEach(productId => {

    //   this.lines
    // })

    return order
  }

  add(productId: string, qty = 1): DemoOrder {
    const line = new DemoOrderLine(productId, qty)
    this.lines.push(line)

    return this
  }

  productIds(): string[] {
    if (!Array.isArray(this.lines))
      return []

    return this.lines.map(l => l.productId)
  }
}



@Component({
  selector: 'order-mgr-demo-orders',
  templateUrl: './demo-orders.component.html',
  styleUrls: ['./demo-orders.component.scss'],
})
export class DemoOrdersComponent {

  @Output() new: EventEmitter<Order> = new EventEmitter<Order>();

  wellnessId = "31eaebbc-af39-4411-a997-f2f286c58a9d"
  massageId = "51d89ac4-0ede-49ab-835f-2a3dda81bd70"
  manicureId = "46af990e-dc8f-461d-a48d-f39b9f782b0d"
  pedicureId = "678f7000-5865-4d58-9d92-9a64193b48c4"


  names = ['Wellness 2h/2p', 'Massage']

  demos = new Map<string, DemoOrder>([
    ['Empty', new DemoOrder()],
    ['Manicure', DemoOrder.fromProducts(this.manicureId)],
    ['Pedicure', DemoOrder.fromProducts(this.pedicureId)],
    ['Wellness 2h/2p', DemoOrder.fromProducts(this.wellnessId)],
    ['Massage & Manicure', DemoOrder.new(this.massageId, 1).add(this.manicureId, 1)]  // .fromProducts(this.massageId, this.manicureId)
  ]);

  demoNames: string[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService) {

    this.demoNames = Array.from(this.demos.keys())

  }


  async createDemoOrder(demo: DemoOrder) {


    console.error(demo)

    this.orderMgrSvc.newOrder()

    const products = await this.orderMgrSvc.loadProducts$(...demo.productIds())

    for (let line of demo.lines) {

      const product = products.find(p => p.id == line.productId)

      if (product)
        this.orderMgrSvc.addOrderLineFromProduct(product, line.qty)
      // line.productId

    }

    console.error(this.orderMgrSvc.order)

    this.new.emit(this.orderMgrSvc.order)

  }


}
