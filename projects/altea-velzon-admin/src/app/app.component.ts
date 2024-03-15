import { AfterContentChecked, ChangeDetectorRef, Component } from '@angular/core';
import { BranchService, ProductService, SessionService } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { DbQuery, QueryOperator } from 'ts-common';

@Component({
  selector: 'ngx-altea-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent{
  title = 'altea-velzon-admin';

  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService, private productSvc: ProductService) {
    this.localeService.use('nl-be');


    this.branchSvc.get(this.sessionSvc.branchId).subscribe(branch => {

      this.sessionSvc.branch = branch

      this.configureCaches()
      console.error(branch)

    })
  
    
  }


  async configureCaches() {

    const qry = new DbQuery()
    qry.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    qry.include('options:orderBy=idx.values:orderBy=idx', 'resources.resource', 'items')
    this.productSvc.cacheQuery = qry
    await this.productSvc.initCache()

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
