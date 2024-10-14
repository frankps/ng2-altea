import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { OrderMgrUiService } from '../order-mgr-ui.service';
import { ResourceService } from '../../data-services/sql/resource.service';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';
import { Resource, ResourcePreferences, ResourceType } from 'ts-altea-model';

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

  initialized = false

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


    // Pre-select already selected

    let currentSelectedStaff = this.mgrUiSvc.order.resPrefs?.humIds

    if (ArrayHelper.NotEmpty(currentSelectedStaff) && ArrayHelper.NotEmpty(this.staff))
    {
      let atLeastOne = false
      for (let human of this.staff) {

        if (currentSelectedStaff.indexOf(human.id) >= 0) {
          this.selection[human.id] = true
          atLeastOne = true
        }
      }

      if (atLeastOne) {
        this.preferredStaff = 'preference'
      }
    }

    console.error(this.staff)

    this.initialized = true
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

    const ids = this.preferredStaff == "preference" ? this.selectedResourceIds() : []

    if (!this.mgrUiSvc.order.resPrefs)
      this.mgrUiSvc.order.resPrefs = new ResourcePreferences()

    this.mgrUiSvc.order.resPrefs.humIds = ids

    this.selected.emit(ids)

  }




}
