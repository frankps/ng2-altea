import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ContactService, SessionService } from 'ng-altea-common';
import { Order, ResourceType } from 'ts-altea-model';
import { DashboardService, ToastType } from 'ng-common'
import { NgxSpinnerService } from "ngx-spinner"
import { ObjectHelper } from 'ts-common';


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
export class DemoOrdersComponent implements OnInit {


  paymentType: 'gift' | 'online' = 'online'


  @Output() new: EventEmitter<Order> = new EventEmitter<Order>();

  wellnessId = "31eaebbc-af39-4411-a997-f2f286c58a9d"
  massageId = "51d89ac4-0ede-49ab-835f-2a3dda81bd70"
  manicureId = "46af990e-dc8f-461d-a48d-f39b9f782b0d"
  pedicureId = "678f7000-5865-4d58-9d92-9a64193b48c4"
  bodyslimmingId = "b910237f-09cf-4dff-a265-4e6013224c57"
  bodysculptor12x30 = "3667402e-2e5b-4655-b93e-a9e6955cbd4d"
  bodysculptorReveal30min = "578fd568-5560-473c-931b-1fb770ed85d6"
  veryGoodMorningId = "00ae379f-ea9b-4ab4-a41e-c7e70e6308de"
  heltiBarId = "00ee102f-907e-4319-849b-ed115323f282"

  names = ['Wellness 2h/2p', 'Massage']

  demos = new Map<string, DemoOrder>([
    ['Empty', new DemoOrder()],
    ['Bodyslimming sessie', DemoOrder.fromProducts(this.bodyslimmingId)],
    ['Manicure', DemoOrder.fromProducts(this.manicureId)],
    ['Pedicure', DemoOrder.fromProducts(this.pedicureId)],
    ['Wellness 2h/2p', DemoOrder.fromProducts(this.wellnessId)],
    ['Massage', DemoOrder.new(this.massageId, 1)],
    ['Duo massage', DemoOrder.new(this.massageId, 2)],
    ['Massage & Manicure', DemoOrder.new(this.massageId, 1).add(this.manicureId, 1)],  // .fromProducts(this.massageId, this.manicureId)
    ['BodySculptor 12x30min', DemoOrder.fromProducts(this.bodysculptor12x30)],
    ['BodySculptor Reveal 30min', DemoOrder.fromProducts(this.bodysculptorReveal30min)],
    ['A very good morning', DemoOrder.fromProducts(this.veryGoodMorningId)],
    ['Heltitude products', DemoOrder.fromProducts(this.heltiBarId)]
    //  
  ]);

  /**    
   * Some contacts (deposit mode between brackets)
   */
  contacts = new Map<string, string>([
    ['Hilde Van Driessche (100%)', '44f16d0b-a5bc-4a49-9f6d-9805fae2004e'],   
    ['Nele De Smet (0%)', '013af14a-3689-4c1d-8b7f-92a259f88540'],
    ['Sarah Van Lierde (default)', '0a6d8058-008f-48ab-8576-375aa98cee22']
  ])

  demoNames: string[] = []
  contactNames: string[] = []

  preselect: string = 'Wellness 2h/2p' // = 'Bodyslimming sessie' // 'Wellness 2h/2p'
  onDate: number // = 20240315000000


  constructor(protected orderMgrSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected spinner: NgxSpinnerService, protected contactSvc: ContactService) {

    this.demoNames = Array.from(this.demos.keys())
    this.contactNames = Array.from(this.contacts.keys())

  }



  async setContact(entry) {

    console.error(entry)
    //var entries = this.contacts.entries()

    var contactId = this.contacts.get(entry)

    var contact = await this.contactSvc.get$(contactId)

    console.error(contact)

    await this.orderMgrSvc.setContact(contact)

  }

  async delaySeconds(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));



  }

  async ngOnInit() {

    if (this.preselect) {

      const demoOrder = this.demos.get(this.preselect)

      if (demoOrder) {
        await this.delaySeconds(1)
        await this.createDemoOrder(demoOrder)

        if (this.onDate) {
          this.orderMgrSvc.from = this.onDate

          this.spinner.show()

          await this.orderMgrSvc.getAvailabilities()

          this.spinner.hide()
        }




      }


    }


  }

  async createDemoOrder(demo: DemoOrder) {

    this.spinner.show()

    console.error(demo)

    this.orderMgrSvc.newOrder()

    const products = await this.orderMgrSvc.loadProducts$(...demo.productIds())

    console.error(products)

    for (let line of demo.lines) {

      const product = products.find(p => p.id == line.productId)

      if (product)
        this.orderMgrSvc.addProduct(product, line.qty)
      // line.productId

    }

    const contact = await this.contactSvc.get$('8fdbf31f-1c6d-459a-b997-963dcd0740d8', 'cards')

    if (contact)
      this.orderMgrSvc.setContact(contact)


    await this.orderMgrSvc.calculateLoyalty()

    console.error(this.orderMgrSvc.order)

    this.new.emit(this.orderMgrSvc.order)

    this.spinner.hide()


  }


}
