import { Component, ViewChild, OnInit, Injectable } from '@angular/core';
//import { Gender, OnlineMode, Product, ProductType, Price, DaysOfWeekShort, ProductTypeIcons, ProductOption, ProductResource, ResourceType, ResourceTypeIcons, Resource, Schedule } from 'ts-altea-model'
//import { BackendHttpServiceBase, DashboardService, FormCardSectionEventData, ToastType } from 'ng-common'
import { ActivatedRoute, Router } from '@angular/router';
import { BackendServiceBase, ApiListResult, ApiResult, ApiBatchProcess, Translation, ObjectHelper, ObjectWithId, CollectionChangeTracker, ApiStatus, DateHelper } from 'ts-common'
import * as _ from "lodash";
import { NgxSpinnerService } from "ngx-spinner"
import { NgTemplateOutlet } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as sc from 'stringcase'
import { scheduled } from 'rxjs';
import * as Rx from "rxjs";
import { DashboardService, ToastType } from '../services/dashboard.service';
import { FormCardSectionEventData } from '../bootstrap5/form-card-section/form-card-section.component';
import { BackendHttpServiceBase } from '../services/backend-http-service-base';


export abstract class NgSectionsComponent {
    editSectionId = ''
    /** used when there are multiple sections with same sectionId to differentiate */
    editSectionParam = ''


    abstract startEditSection(sectionId: string, sectionParam: string): void


    editModeChanged(cardSectionChanged: FormCardSectionEventData) {


        //type: BackendHttpServiceBase
        // switch (cardSectionChanged.sectionId) {
        //   case 'resources':
        //     this.resourceChanges = new CollectionChangeTracker<ProductResource>(this.object.resources, this.productResourcePropsToUpdate)
        //     break
        // }

        console.log(cardSectionChanged)

        if (!cardSectionChanged)
            return

        if (cardSectionChanged.editable) {
            this.editSectionId = cardSectionChanged.sectionId
            this.editSectionParam = cardSectionChanged.sectionParam

            this.startEditSection(this.editSectionId, this.editSectionParam)
        }
        else {
            this.editSectionId = ""
            this.editSectionParam = ""
        }
    }

    sectionIsReadOnly(sectionId: string) {
        return this.editSectionId != sectionId
    }

    sectionInEditIs(sectionId: string) {
        return this.editSectionId == sectionId
    }

    cancel() {

        this.editSectionId = ''
    }
}

@Injectable()
export abstract class NgEditBaseComponent<T extends ObjectWithId> extends NgSectionsComponent implements OnInit {


    id = ''

    /** origObject is used to retrieve previous values when user cancels an edit */
    origObject?: T

    objectType = ''
    object?: T
    isNew = false



    /** */
    sectionProps = new Map<string, string[]>()

    constructor(objectType: string, protected type: { new(): T; }, protected includes: string
        , protected objectSvc: BackendHttpServiceBase<T>, protected route: ActivatedRoute, protected spinner: NgxSpinnerService,
        public dashboardSvc: DashboardService) {
        super()

        this.objectType = objectType
        //this.object = object

    }

    ngOnInit(): void {
        
        this.route.params.subscribe(params => {
            
            console.error('edit-product')

            console.error(params)

            if (params && params['id']) {
                const id = params['id']

                if (id == this.id)
                    return

                if (id == 'new') {
                    this.isNew = true
                    this.object = new this.type
                    this.initNewObject(this.object)

                    console.error('new object', this.object)
                } else {
                    this.getObject(id)
                }

                


            }

        })
    }

    /** origObject is used to retrieve previous values when user cancels an edit */
    resetOrigObject() {
        this.origObject = ObjectHelper.clone(this.object, this.type)
    }

    initNewObject(object: T) {

    }

    abstract objectRetrieved(object: T): void

    getObject(id: string) {

        console.warn(`getObject('${id}')`)

        this.spinner.show()  


        // 'prices,options:orderBy=idx.values:orderBy=idx,items:orderBy=idx,resources:orderBy=idx.resource'
        this.objectSvc.get(id, this.includes).subscribe((res: any) => {

            //  res.gender = Gender.unisex
            this.object = res as T

            this.resetOrigObject()

            console.error(this.object)

            console.error(this.origObject)

            this.editSectionId = ''

            this.objectRetrieved(this.object)

            this.spinner.hide()
            console.error(res)
        })
    }



    saveSection(sectionProps: Map<string, string[]>, editSection: string) {


        this.spinner.show()

        console.error(`Start saving section ${editSection}`)

        if (!this.object) {
            console.error(`Can't save: object is undefined!`)
        }


        if (!this.object?.id || this.isNew) {
            // then this is a new object => we save instead of update!

            this.objectSvc.create(this.object).subscribe((res: any) => {

                if (res.status == ApiStatus.ok) {
                    this.dashboardSvc.showToastType(ToastType.saveSuccess)
                    this.isNew = false
                    this.object = res.object
                } else {
                    this.dashboardSvc.showToastType(ToastType.saveError)
                }

                console.log('Object saved')
                console.error(res)



                this.spinner.hide()
            })

            this.editSectionId = ''

            return
        }


        const propsToUpdate = sectionProps.get(editSection)

        const update: any = {}
        update['id'] = this.object?.id


        const obj: any = this.object

        if (!propsToUpdate) {

            console.log(`No properties to update ... `)
            this.spinner.hide()
            this.editSectionId = ''
            return
        }

        const origObject: any = this.origObject ? this.origObject : {}


        /*
        function isObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}
*/

        propsToUpdate.forEach(prop => {

            const newValue = obj[prop]

            if (!_.isEqual(origObject[prop], newValue))
                update[prop] = newValue

        })

        console.error('Sending update:')
        console.warn(update)

        const sub = this.objectSvc.update(update).subscribe((res: any) => {

            sub.unsubscribe()

            if (res.status == ApiStatus.ok) {
                this.dashboardSvc.showToastType(ToastType.saveSuccess)
                this.resetOrigObject()
            } else {
                this.dashboardSvc.showToastType(ToastType.saveError)
            }



            this.spinner.hide()
        })

        this.editSectionId = ''
    }


    override cancel() {
        const propsToUpdate = this.sectionProps.get(this.editSectionId)

        if (!propsToUpdate || !this.object || !this.origObject) {
            this.editSectionId = ''
            return
        }

        /* clone needed for resetting child objects (otherwise we start working with origObject after first cancel 
        => second cancel won't work) */
        const clone = ObjectHelper.clone(this.origObject, this.type)

        propsToUpdate.forEach(prop => {

            (this.object as any)[prop] = clone[prop]  //(this.origObject as any)[prop]
        })

        this.editSectionId = ''
    }


    // delete() {
    //     console.error('new delete')
    //     //this.deleteModal?.delete()
    // }


}