import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ResourcePlanningService, ResourceService } from '../../data-services/sql';
import { Resource } from 'ts-altea-model';
import { SessionService } from 'ng-altea-common';
import { Router } from '@angular/router';

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


  constructor(private modalService: NgbModal, protected resourceSvc: ResourceService, protected planningSvc: ResourcePlanningService, protected router: Router,
    protected sessionSvc: SessionService
  ) {

  }

  async ngOnInit() {
    this.persons = await this.resourceSvc.getHumanResources()
  }

  show() {

    console.log('user select')
    this.modalService.open(this.userSelectModal, { backdrop: 'static'})


    this.open = true
  }

  async selectUser(humanResource: Resource, modal: any) {


    

    if (humanResource?.id && !this.sessionSvc.hasRole('admin')) {
      var staffCheckedIn = await this.planningSvc.staffCheckedIn(humanResource.id)

      if (!staffCheckedIn) {

        // redirect

        this.router.navigate(['aqua', 'staff'])
        
      }
    }

    this.select.emit(humanResource)
    

    this.open = false
    modal.close()
  }
  

}
