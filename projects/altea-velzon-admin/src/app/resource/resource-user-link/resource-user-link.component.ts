import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { UserService } from 'ng-altea-common'
import { Resource, User } from 'ts-altea-model'
import { DbQuery, QueryOperator } from 'ts-common'

@Component({
  selector: 'ngx-altea-resource-user-link',
  templateUrl: './resource-user-link.component.html',
  styleUrls: ['./resource-user-link.component.scss']
})
export class ResourceUserLinkComponent {

  @Output() select: EventEmitter<User> = new EventEmitter<User>()

  search: string

  css_cls_row = 'mt-3'
  initialized = false
  @ViewChild('searchUserForm')
  searchUserForm: NgForm

  users: User[]


  constructor(protected userSvc: UserService) {

  }

  async ngOnInit() {
    this.initialized = true
  }

  async searchUser($event) {
  

    const query = new DbQuery()
    query.and('provEmail', QueryOperator.contains, this.search)

    this.users = await this.userSvc.query$(query)

    console.error(this.users)
  }


  async selectUser(user: User) {

    if (user)
      this.select.emit(user)
  }


}
