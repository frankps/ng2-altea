import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ResourceService } from '../../resource.service';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';
import { Resource, ResourceType } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-staff-select',
  templateUrl: './staff-select.component.html',
  styleUrls: ['./staff-select.component.css']
})
export class StaffSelectComponent implements OnInit {

  preferredStaff: 'noPreference' | 'preference' = 'noPreference'
  staff: Resource[] = []
  @Output() selected: EventEmitter<string[]> = new EventEmitter<string[]>();

  selection = {}

  constructor(protected mgrUiSvc: OrderMgrUiService, protected resourceSvc: ResourceService) {

  }

  async ngOnInit() {
    await this.loadStaff()
  }

  async loadStaff() {

    if (!this.mgrUiSvc.branch) {
      console.error(`Can't load resources: branch not specified!`)
    }

    const query = new DbQuery()

    query.and('branchId', QueryOperator.equals, this.mgrUiSvc.branch.id)
    query.and('type', QueryOperator.equals, ResourceType.human)
    query.and('isGroup', QueryOperator.equals, false)
    query.and('online', QueryOperator.equals, true)
    query.and('act', QueryOperator.equals, true)
    query.orderBy('name')

    query.take = 20

    this.staff = await this.resourceSvc.query$(query)

    console.error(this.staff)
  }

  selectedResourceIds(): string[] {
    const ids = []

    if (this.selection) {
      Object.keys(this.selection).forEach(key => {

        if (this.selection[key])
          ids.push(key)
      })
    }

    return ids
  }

  hasSelectedResourceIds(): boolean {
    const ids = this.selectedResourceIds()
    return ArrayHelper.AtLeastOneItem(ids)
  }

  canContinue(): boolean {

    return this.preferredStaff == 'noPreference' || (this.preferredStaff == 'preference' && this.hasSelectedResourceIds())
  }


  continue() {

    const ids = this.selectedResourceIds()
    this.selected.emit(ids)

  }




}
