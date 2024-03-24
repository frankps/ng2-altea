import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BranchService, ProductService, ResourceService, SessionService, TypeInfoService } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { TypeInfo } from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'ngx-altea-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'altea-velzon-admin';
  appReady = false

  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService
    , private productSvc: ProductService, private resourceSvc: ResourceService, private typeInfoSvc: TypeInfoService) {
    this.localeService.use('nl-be');




  }

  async ngOnInit() {

    

    await this.configureCaches()

    const branch = await this.branchSvc.get$(this.sessionSvc.branchId)

    this.sessionSvc.branch = branch
    console.error(branch)

    this.appReady = true
    
  }


  async configureCaches() {

    console.warn('configureCaches')

    const typeInfoQry = new DbQuery()
    typeInfoQry.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)

    const typeInfos = await this.typeInfoSvc.query$(typeInfoQry)
    console.warn(typeInfos)

    const productQry = new DbQuery()
    productQry.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    productQry.include('options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx.resource', 'items:orderBy=idx')
    productQry.take = 1000
    this.productSvc.cacheQuery = productQry
    this.productSvc.linkedTypes = ['ProductItem', 'ProductResource']
    await this.productSvc.initCache(typeInfos)

    const resourceQry = new DbQuery()
    resourceQry.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    // 'groups.group,schedules:orderBy=idx.planning,children.child,user'
    resourceQry.include('groups.group', 'schedules:orderBy=idx.planning', 'children.child', 'user')
    resourceQry.take = 1000
    this.resourceSvc.cacheQuery = resourceQry
    await this.resourceSvc.initCache(typeInfos)

    this.appReady = true

  }




  /*  
  
  
  options:orderBy=idx.values:orderBy=idx
  options:orderBy=idx.values:orderBy=idx,resources.resource
  options:orderBy=idx.values:orderBy=idx', 'resources.resource', 'items'
  options:orderBy=idx.values:orderBy=idx
  
  
  
  
  
  implements AfterContentChecked 
    , private changeDetector: ChangeDetectorRef
    ngAfterContentChecked(): void {
      this.changeDetector.detectChanges();
    } */


}
