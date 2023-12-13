import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {  ModalDirective } from 'ngx-bootstrap/modal';
import { Modal } from '../../ui';



@Component({
  selector: 'ngx-altea-ngx-modal',
  templateUrl: './ngx-modal.component.html',
  styleUrls: ['./ngx-modal.component.scss'],
})
export class NgxModalComponent implements OnInit {

  @ViewChild('ngxBsModal', { static: true }) ngxBsModal?: ModalDirective;

  @Input() set modal(value: Modal) {

    if (!value)
      return

    this.title = value.title
    this.size = value.size
  }

  @Input() showHeader = true


  @Input() icon = ''

  @Input() title = ''

  /** lg, xl, sm */
  @Input() size = 'sm'


  //constructor() { }

  ngOnInit(): void {
    console.log(this.title)

    // this.ngxBsModal.onHide.subscribe(hide => {

    //   console.log('Hiding ......  ###############')

    // })
  }

  show() {
    this.ngxBsModal?.show()
  }

  hide() {
    this.ngxBsModal?.hide()
  }

  modalClass() {
    return `modal-dialog modal-${this.size}`
  }


}
