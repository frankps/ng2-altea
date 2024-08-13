import { Component, OnInit } from '@angular/core';
import { LocalService } from 'ng-altea-common';

@Component({
  selector: 'app-door-access',
  templateUrl: './door-access.component.html',
  styleUrls: ['./door-access.component.scss']
})
export class DoorAccessComponent implements OnInit {

  users: any[]

  constructor(protected localSvc: LocalService) {
  }

  async ngOnInit(): Promise<void> {

    console.error('loadUsers')
    await this.loadUsers()

  }

  async loadUsers() {

    this.users = await this.localSvc.getDoorAccessUsers$()

    console.log(this.users)

  }
}
