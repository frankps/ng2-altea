import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ObjectService, SessionService } from 'ng-altea-common';
import { Order, OrderPerson, OrderPersonMgr, PersonLine } from 'ts-altea-model';
import { ObjectHelper } from 'ts-common';
import * as _ from "lodash";


@Component({
  selector: 'order-mgr-person-select',
  templateUrl: './person-select.component.html',
  styleUrls: ['./person-select.component.scss'],
})
export class PersonSelectComponent implements OnInit {

  @Output() selected: EventEmitter<void> = new EventEmitter();

  personLines: PersonLine[] = []

  // copied from order.persons
  persons: OrderPerson[] = []



  constructor(protected mgrUiSvc: OrderMgrUiService, protected sessionSvc: SessionService, protected dbSvc: ObjectService) {

  }

  ngOnInit() {
    console.warn('PERSON SELECT   INIT !!!')
    this.personLines = this.mgrUiSvc.order.getPersonLines()
    this.refreshPersons()
    console.warn(this.persons)

  }


  updateOrderLines() {



  }

  selectionChanged(personLine: PersonLine, $event) {
    console.warn(personLine)
    console.warn($event)

    const order = this.mgrUiSvc.order

    const personLinesForOrderLine = this.personLines.filter(pl => pl.orderLineId == personLine.orderLineId)
    const personIds = personLinesForOrderLine.map(pl => pl.personId)
    personLine.orderLine.persons =  _.uniq(personIds)
   
    console.warn(personLinesForOrderLine)
  }


  increment() {
    this.mgrUiSvc.order.nrOfPersons++
    this.updatePersons(this.mgrUiSvc.order)
    this.refreshPersons()
  }

  decrement() {
    if (this.mgrUiSvc.order.nrOfPersons > 1) {
      this.mgrUiSvc.order.nrOfPersons--
      this.updatePersons(this.mgrUiSvc.order)
      this.refreshPersons()
    }
  }


   

  refreshPersons() {

    if (this.mgrUiSvc.order.persons)
      // we clone to force update of ng-select control
      this.persons = ObjectHelper.clone(this.mgrUiSvc.order.persons, OrderPerson)
    else {
      this.mgrUiSvc.order.persons = []
      this.persons = []
    }

    if (this.persons && this.persons.length > 0) {
      for (let personLine of this.personLines) {
        if (!personLine.personId)
          personLine.personId = this.persons[0].id
      }
    }

  }

  updatePersons(order: Order) {

    if (!order.persons)
      order.persons = []

    if (order.persons.length != order.nrOfPersons) {
      let mgr = new OrderPersonMgr(order.persons)
      mgr.checkPersons(order.nrOfPersons);
    }
  }

  continue() {

    this.selected.emit()

  }


}
