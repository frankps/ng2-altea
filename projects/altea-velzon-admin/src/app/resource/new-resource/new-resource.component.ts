import { Component, OnInit, ViewChild } from '@angular/core';
import { Product, ProductType, ProductTypeIcons, Resource, ResourceType } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectHelper } from 'ts-common'
import { ProductService, ResourceService, SessionService } from 'ng-altea-common'
import { Observable } from 'rxjs';
import { TranslationService } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";
import { ConnectTo } from 'ts-common'


@Component({
  selector: 'ngx-altea-new-resource',
  templateUrl: './new-resource.component.html',
  styleUrls: ['./new-resource.component.scss'],
})
export class NewResourceComponent {

  @ViewChild('newModal') public newModal: NgTemplateOutlet | null = null
  step = 1
  nrOfSteps = 1

  message = ''

  newObject: Resource = new Resource()


  constructor(private objectSvc: ResourceService, private translationSvc: TranslationService, private modalService: NgbModal, protected route: ActivatedRoute
    , private sessionSvc: SessionService, private router: Router, protected spinner: NgxSpinnerService) {

  }

  show(type: ResourceType) {

    this.newObject = new Resource()
    this.newObject.type = type

    this.modalService.open(this.newModal)

    this.step = 1
  }


  createObject(modal: NgbActiveModal | null = null) {

    this.spinner.show()

    this.newObject.branch = new ConnectTo(this.sessionSvc.branchId)
   
    delete this.newObject._endDate
    delete this.newObject._startDate
 //   const object = ObjectHelper.clone(this.newObject, Resource)
    
    this.objectSvc.create(this.newObject, this.sessionSvc.humanResource?.id).subscribe((res: ApiResult<Resource>) => {

      console.log('Object saved')
      console.error(res)
  
      if (res.status != ApiStatus.ok) {
        this.message = res.message.split('\n')[0]
        this.step = -1
      }

      if (res.status == ApiStatus.ok) {
        if (modal)
          modal.close()

        console.error(this.router.getCurrentNavigation())

        const url = '/aqua/resources/human/' + res.object.id

        console.error(url)

        this.router.navigate([url])
      }

      this.spinner.hide()
    })

  }


}
