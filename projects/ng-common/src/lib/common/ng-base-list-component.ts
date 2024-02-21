import { ApiListResult, DbQuery, QueryOperator, Translation, ApiResult, ApiStatus, ObjectWithId } from 'ts-common'
import { Observable, take, takeUntil } from 'rxjs';
import * as _ from "lodash";
import { NgBaseComponent } from './ng-base-component';
import { BackendHttpServiceBase, ObjectChange, ObjectChangeType } from '../services/backend-http-service-base';
import { DashboardService } from '../services/dashboard.service';
import { NgxSpinnerComponent, NgxSpinnerService } from 'ngx-spinner';
import { Route, Router } from '@angular/router';

export class NgBaseListConfig {

    public searchEnabled = false
    public addEnabled = false
    public path = ''
    public pathIdPrefix? = ''

    /** path used to navigate from list to edit object */

    constructor() {
    }
}

export abstract class NgBaseListComponent<T extends ObjectWithId> extends NgBaseComponent {

    protected objects$?: Observable<ApiListResult<T>> | null
    protected objects: T[] = []


    protected editMode = false
    protected selectedIds = []

    /**
     * 
     * @param objectSvc 
     * @param visibleProperties these properties will be updated when changes happen 
     */
    constructor(protected visibleProperties: string[]
        , protected config: NgBaseListConfig
        , protected objectSvc: BackendHttpServiceBase<T>
        , protected dashboardSvc: DashboardService
        , protected spinner: NgxSpinnerService
        , protected router: Router) {
        super()

    }

    toggleEditMode() {
        this.selectedIds = []
        this.editMode = !this.editMode
    }

    visiblePropertyChanged(change: any): boolean {

        const props = Object.keys(change)

        if (!this.visibleProperties)
            return false

        for (let prop of props) {

            if (this.visibleProperties.indexOf(prop) >= 0)
                return true

        }

        return false
    }

    getSearchDbQuery(searchFor: string): DbQuery | null {

        return null

    }

    search(searchFor?: string) {
        /* 
                if (!searchFor) {
                    this.getListObjects()
                    return
                } */

        this.objects$ = null
        const query = this.getSearchDbQuery(searchFor)

        if (!query)
            return

        this.spinner.show()

        this.objects$ = this.objectSvc.query(query)

        this.objects$.pipe(takeUntil(this.ngUnsubscribe), take(1)).subscribe(res => {

            if (res?.data)
                this.objects = res.data
            else
                this.objects = []

            this.spinner.hide()
        })
    }

    addNew() { }


    getInitDbQuery(): DbQuery | null {

        return null
        /*
        const query = new DbQuery()
        query.and('deleted', QueryOperator.equals, false)
    
        query.take = 20
        query.orderBy('code')

        return query
        */
    }


    objectsRetrieved(objects: T[]) {

    }


    getListObjects() {
        this.spinner.show()

        const query = this.getInitDbQuery()

        if (!query)
            return

        console.error(query)

        this.objects$ = this.objectSvc.query(query)

        this.objects$.pipe(takeUntil(this.ngUnsubscribe), take(1)).subscribe(res => {

            console.error(res)

            if (res?.data)
                this.objects = res.data
            else
                this.objects = []

            this.objectsRetrieved(this.objects)

            this.spinner.hide();

        })
    }


    /** Call this method from the ngOnInit() of derived objects: super._ngOnInit() 
      Subscribes to changes coming from other components (for instance the edit form).
      Shows the search & add functionality in the dashboard header as requested.
    */
    _ngOnInit() {



        this.objectSvc.changes$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((change: ObjectChange<T>) => {


            console.error(change)


            const objectId = change.objectId()


            // remove item from list (when doing soft delete)
            if (change.change == ObjectChangeType.delete && objectId) {
                console.warn(this.objects)

                const res = _.remove(this.objects, o => o.id == objectId)
                this.objects = [... this.objects]
                console.warn(this.objects)
                console.error(res)
                return
            }

            switch (change.change) {

                case ObjectChangeType.create:
                    const newObject = change.obj()

                    if (!newObject)
                        break

                    this.objects = [... this.objects, newObject]
                    break


            }


            const changedObject = change.object

            // update visible properties in the list
            if (changedObject && this.visiblePropertyChanged(changedObject)) {
                const object: any = this.objects.find(o => o.id == objectId)

                console.warn(object)
                if (!object)
                    return

                for (const prop of this.visibleProperties) {
                    if (changedObject[prop]) {

                        object[prop] = changedObject[prop]
                    }
                }
            }

        })

        this.dashboardSvc.showSearch = this.config.searchEnabled

        if (this.config.searchEnabled) {
            this.dashboardSvc.search$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(searchString => {
                this.search(searchString)
            })
        }

        this.dashboardSvc.showAdd = this.config.addEnabled
        if (this.config.addEnabled) {

            this.dashboardSvc.add$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(add => {
                this.addNew()
            })
        }


    }


    select(object: ObjectWithId) {

        const path = []

        path.push(this.dashboardSvc.rootPath, this.config.path)

        if (this.dashboardSvc.isMobile)
            path.push('mobile')

        if (this.config.pathIdPrefix && this.config.pathIdPrefix.length > 0)
            path.push(this.config.pathIdPrefix)

        if (object?.id)
            path.push(object?.id)

        this.router.navigate(path)

    }



}

