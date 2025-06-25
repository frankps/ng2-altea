import { Component, OnInit } from '@angular/core';
import { DemoOrder, OrderMgrUiService } from 'ng-altea-common';
import { NgxSpinnerService } from 'ngx-spinner';
import { ArrayHelper, DateHelper } from 'ts-common';
import * as dateFns from 'date-fns'
import { Order, Product, ReservationOptionSet } from 'ts-altea-model';

export class LastMinute {
  title: string
  date: Date
  price: number

  from: LastMinuteSet
}

/** a set represents all last minutes for a certain product (=orders) and a certain date = 1 request */
export class LastMinuteSet {
  label: string
  date: Date
  order: Order
  options: ReservationOptionSet

  toLastMinutes() : LastMinute[] {
    return this.options.options.map(option => {
      let lastMinute = new LastMinute()
     
      lastMinute.title = this.label
      lastMinute.date = option.date
      lastMinute.price = option.price
      lastMinute.from = this

      return lastMinute
    })
  }
}

@Component({
  selector: 'app-last-minutes',
  templateUrl: './last-minutes.component.html',
  styleUrls: ['./last-minutes.component.scss']
})
export class LastMinutesComponent implements OnInit {

  wellnessId = "31eaebbc-af39-4411-a997-f2f286c58a9d"

  products: Product[] = []

  
  lastMinuteSets: LastMinuteSet[] = []

  searching: boolean = false
  lastMinutes: LastMinute[] = []

  constructor(protected orderMgrSvc: OrderMgrUiService, protected spinner: NgxSpinnerService) {

  }

  async ngOnInit() {
    this.products = await this.orderMgrSvc.loadProducts$(this.wellnessId)

    await this.createLastMinutes()
  }  

  haveLastMinutes() : boolean {
    return ArrayHelper.NotEmpty(this.lastMinutes)
  }

  async createWellnessLastMinutes(daysInFuture: number = 0) : Promise<LastMinuteSet> {

    await this.orderMgrSvc.newOrder()

    let wellness = this.products.find(p => p.id == this.wellnessId)

    await this.orderMgrSvc.addProduct(wellness, 1)

    let date = new Date()
    date = dateFns.addDays(date, daysInFuture)

    this.orderMgrSvc.from = DateHelper.yyyyMMdd000000(date)

    console.error(this.orderMgrSvc.order)

    await this.orderMgrSvc.getAvailabilities()

    console.warn(this.orderMgrSvc.optionSet)

    let lastMinutes = new LastMinuteSet()

    let suffix = 'op'

    switch (daysInFuture) {
      case 0:
        suffix = 'vandaag'
        break
      case 1:
        suffix = 'morgen'
        break
      case 2:
        suffix = 'overmorgen'
        break
    }

    lastMinutes.label = "Wellness " + suffix
    lastMinutes.date = date
    lastMinutes.order = this.orderMgrSvc.order
    lastMinutes.options = this.orderMgrSvc.optionSet

    return lastMinutes

  }

  async createLastMinutes() {

    this.searching = true
    this.spinner.show()

    try {
      let lastMinuteSet = await this.createWellnessLastMinutes(0) // today

      this.lastMinuteSets.push(lastMinuteSet)
  
      this.lastMinutes = this.lastMinuteSets.flatMap(set => set.toLastMinutes())

    } finally {
      this.searching = false
      this.spinner.hide()
    }



  }

  /*
  this.orderMgrUiSvc.from = DateHelper.yyyyMMdd000000(event)

    console.error(this.orderMgrUiSvc.from)
    this.selected.emit(event)

    

    // this.orderMgrUiSvc.getPossibleDates()
    this.spinner.show()

    await this.orderMgrUiSvc.getAvailabilities()
    */
}
