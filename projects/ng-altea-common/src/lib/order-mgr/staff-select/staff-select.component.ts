import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ResourceService } from '../../resource.service';
import { DbQuery, QueryOperator } from 'ts-common';
import { Resource, ResourceType } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-staff-select',
  templateUrl: './staff-select.component.html',
  styleUrls: ['./staff-select.component.css']
})
export class StaffSelectComponent implements OnInit {

  preferredStaff
  staff: Resource[] = []
  @Output() selected: EventEmitter<string[]> = new EventEmitter<string[]>();

  selection = {}

  constructor(protected mgrUiSvc: OrderMgrUiService, protected resourceSvc: ResourceService) {

  }

  async ngOnInit() {
    await this.loadStaff()
  }
  
  async loadStaff() {
    const query = new DbQuery()

    query.and('type', QueryOperator.equals, ResourceType.human)
    query.and('isGroup', QueryOperator.equals, false)
    query.and('online', QueryOperator.equals, true)
    query.and('act', QueryOperator.equals, true)
    query.orderBy('name')

    query.take = 20

    this.staff = await this.resourceSvc.query$(query)

    console.error(this.staff)
  }

  continue() {

    const ids = []

    if (this.selection) {
      Object.keys(this.selection).forEach(key => {

        if (this.selection[key])
          ids.push(key)
      })
    }

    this.selected.emit(ids)

  }




}
