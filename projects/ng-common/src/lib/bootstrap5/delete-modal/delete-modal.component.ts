import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner"
import * as sc from 'stringcase'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { TranslationService } from '../../services/translation.service';
import { BackendHttpServiceBase } from '../../services/backend-http-service-base';
import { DashboardService } from '../../services/dashboard.service';


@Component({
  selector: 'ngx-altea-delete-modal',
  templateUrl: './delete-modal.component.html',
  styleUrls: ['./delete-modal.component.scss'],
})
export class DeleteModalComponent {

  @ViewChild('deleteModal') public deleteModal?: NgbModal; // NgTemplateOutlet | null = null

  @Input() objectType = ''
  @Input() object?: any
  @Input() config?: { successUrl?: string, successUrlMobile?: string }

  @Input() objectSvc?: BackendHttpServiceBase<ObjectWithId>

  @Output() deleted: EventEmitter<any> = new EventEmitter();


  /** In some languages the article (lidwoord) is different for other words (HET paard vs DE koe) */
  deleteTransParams = { article: null, object_sc: '', object_lc: '', name: '' }

  error = false
  errorMsg?: string | null = ''

  constructor(protected router: Router, protected spinner: NgxSpinnerService, private translationSvc: TranslationService
    , private modalService: NgbModal, private dashboardSvc: DashboardService) {

  }


  async delete() {

    this.error = false
    this.errorMsg = null

    /** In some languages the article (lidwoord) is different for other words (het paard vs de koe) */
    this.deleteTransParams.article = await this.translationSvc.getTrans('objects.' + this.objectType + '.article')

    this.deleteTransParams.object_sc = sc.sentencecase(this.objectType)
    this.deleteTransParams.object_lc = sc.lowercase(this.objectType)

    if (this.object)
      this.deleteTransParams.name = this.object.name


    console.error(this.deleteTransParams)

    this.modalService.open(this.deleteModal)
    // console.error('Delete it')

  }

  confirmDelete(modal: any) {

    let me = this

    this.spinner.show()

    this.objectSvc?.delete(this.object.id).subscribe(res => {
      console.error(res)


      me.postDelete(modal, res)
    })


  }


  postDelete(modal: any, res: ApiResult<any>) {

    console.error(res)

    this.spinner.hide()
    if (res.status === ApiStatus.ok) {
      let url //= this.config?.successUrl

      if (this.dashboardSvc.isMobile && this.config?.successUrlMobile)
        url = this.config?.successUrlMobile
      else
        url = this.config?.successUrl

      if (url) {
        console.error(url)
        this.router.navigate([url])
      }

      this.deleted.emit(this.object)

      modal.close()

    } else {
      this.error = true
      this.errorMsg = res?.message
    }


  }


  cancelDelete(modal: any) {


    modal.close()

  }



}
