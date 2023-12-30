import { Component, OnInit, Input, TemplateRef, Output, EventEmitter } from '@angular/core';

export class FormCardSectionEventData {

  sectionId = ''
  sectionParam = ''
  editable = false

  constructor(sectionId: string, sectionParam: string, edit: boolean) {
    this.sectionId = sectionId
    this.sectionParam = sectionParam
    this.editable = edit
  }

}

@Component({
  selector: 'ngx-altea-form-card-section',
  templateUrl: './form-card-section.component.html',
  styleUrls: ['./form-card-section.component.scss'],
})
export class FormCardSectionComponent {  //  implements OnInit

  @Input() sectionName = ''
  @Input() trans = true

  @Input() sectionId = ''
  @Input() editSectionId = ''

  /** we can have multiple sections with same sectionId, then we can use sectionParam to differentiate */
  @Input() sectionParam = ''
  @Input() editSectionParam = ''

  @Input() icon = ''
  @Input() showBody = true

  /** False: then a cancel & save button will be shown when in edit. True: only pen button is used to toggle between readOnly and edit. */
  @Input() toggleEditMode = false

  @Input() showButtons = true

  @Input() showAddButton = false

  @Input() enableSave = true

  @Input() help: string | undefined
  
    //= 'ui.branch.edit.sections.deposit.help'
  // editMode = false

  //constructor() { }

  @Output() cancel: EventEmitter<string> = new EventEmitter()
  @Output() save: EventEmitter<string> = new EventEmitter()
  @Output() add: EventEmitter<string> = new EventEmitter()

  @Output() editModeChanged: EventEmitter<FormCardSectionEventData> = new EventEmitter()

  //ngOnInit(): void { }

  get sectionNameClass(): string {

    return this.editMode?'sectionNameActive':'sectionName'

  }

  get editMode(): boolean {
    return (this.sectionId === this.editSectionId && this.sectionParam === this.editSectionParam)
  }

  triggerSave() {
    //  this.editMode = false
    this.save.emit(this.sectionId)
  }

  triggerCancel() {
    //  this.editMode = false
    this.cancel.emit(this.sectionId)
  }

  triggerAdd() {
    this.add.emit(this.sectionId)
  }

  startEdit() {
    //  this.editMode = true
    console.error('startEdit')
    //  this.editSection = this.sectionId
    this.editModeChanged.emit(new FormCardSectionEventData(this.sectionId, this.sectionParam, true))
  }

  stopEdit() {
    //  this.editMode = false
    console.error('stopEdit')

    this.editModeChanged.emit(new FormCardSectionEventData(this.sectionId, this.sectionParam, false))
  }

  cancelEdit() {
    //   this.editMode = false
    console.error('cancelEdit')
    //  this.editSection = null
    this.editModeChanged.emit(new FormCardSectionEventData(this.sectionId, this.sectionParam, false))
  }

}

