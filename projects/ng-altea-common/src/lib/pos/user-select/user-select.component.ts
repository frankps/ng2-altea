import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ResourceService } from '../../data-services/sql';
import { Resource } from 'ts-altea-model';

@Component({
  selector: 'user-select',
  templateUrl: './user-select.component.html',
  styleUrls: ['./user-select.component.css']
})
export class UserSelectComponent implements OnInit {
  @ViewChild('userSelectModal') public userSelectModal?: NgbModal;

  public open = false
  persons: Resource[]

  @Output() select: EventEmitter<Resource> = new EventEmitter<Resource>();


  constructor(private modalService: NgbModal, protected resourceSvc: ResourceService) {

  }

  async ngOnInit() {
    this.persons = await this.resourceSvc.getHumanResources()
  }

  show() {

    this.modalService.open(this.userSelectModal, { backdrop: 'static'})

    this.open = true
  }

  selectUser(humanResource: Resource, modal: any) {

    this.select.emit(humanResource)

    this.open = false
    modal.close()
  }
  

}
