import { AfterContentChecked, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { BranchService, IdleNotificationService, LoyaltyProgramService, ObjectService, ProductService, ResourceService, ScheduleService, SessionService, TemplateService, TypeInfoService, IdleNotification } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { AppMode, Branch, LoyaltyProgram, Product, Resource, Template, TypeInfo } from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';
//import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
//import { Idle, IdleExpiry, LocalStorageExpiry, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { UserSelectComponent } from 'projects/ng-altea-common/src/lib/pos/user-select/user-select.component';
import { DashboardService } from 'ng-common';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ngx-altea-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent implements OnInit {
  title = 'altea-velzon-admin';
  appReady = false

  // for the idle functionality
  idleState = 'Not started.';
  timedOut = false;

  @ViewChild('userSelect') public userSelect: UserSelectComponent;

  currentState: IdleNotification = {
    isIdle: false,
    idleTimeSeconds: 15,
    timestamp: new Date()
  };


  private idleSubscription?: Subscription;




  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService, private dashboardSvc: DashboardService, private idleService: IdleNotificationService
    , private productSvc: ProductService, private resourceSvc: ResourceService, private typeInfoSvc: TypeInfoService,
    private scheduleSvc: ScheduleService, private loyaltyProgramSvc: LoyaltyProgramService, private templateSvc: TemplateService, private objectSvc: ObjectService, protected router: Router) {
    this.localeService.use('nl-be');



  }


  async ngOnInit() {

    // Initialize the idle service with custom config, all in seconds
    
    this.idleService.initialize({
      idleTimeSeconds: 90,              // seconds before idle
    });


    //this.configUserSelectOnIdle(this.idle)

    this.sessionSvc.appMode = AppMode.pos

    // await this.configureCaches()


    const branch = await this.branchSvc.get$(this.sessionSvc.branchId)
    this.sessionSvc.branch = branch
    console.error(branch)


    this.appReady = true

    this.sessionSvc.branchSub.subscribe(async branch => {
      console.warn('branch', branch)

      if (branch?.id) {

        await this.configureCaches(branch.id)

        // this.router.navigate([branch.unique, 'branch'])

      }


    })

    this.initIdle()


  }

  /*
  to do on idle: 
        if (this.userSelect && !this.userSelect.open)
          this.userSelect.show() 
  */


  /*   resetIdle() {
  
      this.idleState = 'Started.';
      this.timedOut = false;
    } */


  userSelected(humanResource: Resource) {
    console.warn(humanResource)
    this.sessionSvc.humanResource = humanResource

    this.dashboardSvc.resourceId = humanResource?.id
  }

  initIdle() {

    // Subscribe to idle notifications
    this.idleSubscription = this.idleService.idleNotification$?.subscribe(
      (notification: IdleNotification) => {
        this.currentState = notification;

        console.log('[SCHEDULER] Idle notification:', notification);
        // Component-specific logic
        this.handleIdleStateChange(notification);

        
      }
    );
  }

  private handleIdleStateChange(notification: IdleNotification): void {

    // Auto-save if user has been idle for more than 2 minutes
   // let reactToIdle = notification.isIdle && notification.idleTimeSeconds > 30;

    if (notification.isIdle) {
      if (this.userSelect && !this.userSelect.open)
        this.userSelect.show()
    }


  }



  ngOnDestroy(): void {
    this.idleSubscription?.unsubscribe();
  }


  async configureCaches(branchId: string) {

    console.warn('configureCaches')

    const typeInfoQry = new DbQuery()
    typeInfoQry.and('branchId', QueryOperator.equals, branchId)

    const typeInfos = await this.typeInfoSvc.query$(typeInfoQry)
    console.warn(typeInfos)

    const branchQry = new DbQuery()
    branchQry.and('id', QueryOperator.equals, branchId)
    branchQry.take = 1000
    this.branchSvc.cacheQuery = branchQry
    await this.branchSvc.initCache(typeInfos)
    this.objectSvc.typeCaches.set(Branch, this.branchSvc)

    const productQry = new DbQuery()
    productQry.and('branchId', QueryOperator.equals, branchId)
    productQry.include('options:orderBy=idx.values:orderBy=idx', 'resources:orderBy=idx', 'items:orderBy=idx', 'prices')   // we previously also fteched the resource: 'resources:orderBy=idx.resource'
    productQry.take = 1000
    this.productSvc.cacheQuery = productQry
    this.productSvc.linkedTypes = ['ProductItem', 'ProductResource']
    await this.productSvc.initCache(typeInfos)
    this.objectSvc.typeCaches.set(Product, this.productSvc)

    const resourceQry = new DbQuery()
    resourceQry.and('branchId', QueryOperator.equals, branchId)
    resourceQry.include('groups.group', 'schedules:orderBy=idx.planning', 'children.child', 'user')
    resourceQry.take = 1000
    this.resourceSvc.cacheQuery = resourceQry
    await this.resourceSvc.initCache(typeInfos)
    this.objectSvc.typeCaches.set(Resource, this.resourceSvc)




    const loyaltyProgramQry = new DbQuery()
    loyaltyProgramQry.and('branchId', QueryOperator.equals, branchId)
    //loyaltyProgramQry.include('groups.group', 'schedules:orderBy=idx.planning', 'children.child', 'user')
    loyaltyProgramQry.take = 1000
    this.loyaltyProgramSvc.cacheQuery = loyaltyProgramQry
    await this.loyaltyProgramSvc.initCache(typeInfos)
    this.objectSvc.typeCaches.set(LoyaltyProgram, this.loyaltyProgramSvc)

    const templateQry = new DbQuery()
    templateQry.and('branchId', QueryOperator.equals, branchId)
    templateQry.take = 1000
    this.templateSvc.cacheQuery = templateQry
    await this.templateSvc.initCache(typeInfos)
    this.objectSvc.typeCaches.set(Template, this.templateSvc)


    /* 
    const scheduleQry = new DbQuery()
    scheduleQry.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    scheduleQry.include('planning')
    scheduleQry.take = 1000
    this.scheduleSvc.cacheQuery = scheduleQry
    await this.scheduleSvc.initCache(typeInfos) */


    this.appReady = true

  }


  async test() {



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
