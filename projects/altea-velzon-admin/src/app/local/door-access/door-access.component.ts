import { Component, OnInit } from '@angular/core';
import { LocalService } from 'ng-altea-common';
import { NgxSpinnerService } from "ngx-spinner"
import { DashboardService, ToastType } from 'ng-common'
import { ArrayHelper } from 'ts-common';

@Component({
  selector: 'app-door-access',
  templateUrl: './door-access.component.html',
  styleUrls: ['./door-access.component.scss']
})
export class DoorAccessComponent implements OnInit {

  users: any[]

  selected = {}

  constructor(protected localSvc: LocalService, protected spinner: NgxSpinnerService, protected dashboardSvc: DashboardService) {
  }

  async ngOnInit(): Promise<void> {

    console.error('loadUsers')
    await this.loadUsers()

  }

  async loadUsers() {

    this.users = await this.localSvc.getDoorAccessUsers$()

    console.log(this.users)

  }

  getSelectedUsers() {

    return Object.keys(this.selected).filter(key => this.selected[key])
  }

  async deleteUsers() {

    // console.log(this.selected)

    let uuids = this.getSelectedUsers()

    if (ArrayHelper.IsEmpty(uuids)) {
      this.dashboardSvc.showErrorToast('No users selected')
      return
    }



    let error

    try {
      this.spinner.show()



      console.log('Users to delete:', uuids)

      //      let users = this.users.filter(user => uuids.includes(user.uuid))

      var res = await this.localSvc.deleteDoorAccessUsers$(uuids)

      console.log(res)

      await this.loadUsers()


      this.selected = {}


    } catch (err) {

      console.error(err)
      error = 'Problem updating WhatsApp template!'

    } finally {

      this.spinner.hide()

      if (error)
        this.dashboardSvc.showErrorToast(error)
      else
        this.dashboardSvc.showSuccessToast('User(s) deleted')

    }







  }
}
