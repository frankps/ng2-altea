import { Route } from '@angular/router';
import { LayoutComponent } from './velzon/layouts/layout.component';
import { AppComponent } from './app.component';
import { DemoComponent } from './demo/demo/demo.component';

export const appRoutes: Route[] = [
  { path: 'auth', loadChildren: () => import('./velzon/account/account.module').then(m => m.AccountModule)  },
  {
  path: ':branch', component: LayoutComponent,
  //loadChildren: () => import('./resource/resource.module').then(m => m.ResourceModule) 
  children: [
    { path: "catalog", loadChildren: () => import(`./product/product.module`).then(m => m.ProductModule) },
    { path: "resources", loadChildren: () => import(`./resource/resource.module`).then(m => m.ResourceModule) },
    { path: "templates", loadChildren: () => import(`./template/template.module`).then(m => m.TemplateModule) },
    { path: "contacts", loadChildren: () => import(`./contact/contact.module`).then(m => m.ContactModule) },
    { path: "orders", loadChildren: () => import(`./order/order.module`).then(m => m.OrderModule) },
    { path: "calendar", loadChildren: () => import(`./calendar/calendar.module`).then(m => m.CalendarModule) },
    { path: "branch", loadChildren: () => import(`./branch/branch.module`).then(m => m.BranchModule) },
    { path: "gifts", loadChildren: () => import(`./gift/gift.module`).then(m => m.GiftModule) },
    { path: "tasks", loadChildren: () => import(`./task/task.module`).then(m => m.TaskModule) },
    { path: "accounting", loadChildren: () => import(`./accounting/accounting.module`).then(m => m.AccountingModule) },
    { path: "loyalty", loadChildren: () => import(`./loyalty/loyalty.module`).then(m => m.LoyaltyModule) },
    { path: "subscriptions", loadChildren: () => import(`./subscription/subscription.module`).then(m => m.SubscriptionModule) },
    { path: "messaging", loadChildren: () => import(`./messaging/messaging.module`).then(m => m.MessagingModule) },
    { path: "local", loadChildren: () => import(`./local/local.module`).then(m => m.LocalModule) },
   // { path: "order", loadChildren: () => import(`./order-mgr/order-mgr.module`).then(m => m.OrderMgrModule) },
    { path: "demo", component: DemoComponent },
    { path: "", component: DemoComponent },  
  ]  
  
  //, loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)

  //, component: AppComponent  //LayoutComponent 

  //, loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
}]; 


/*
  {
      path: ":branch", component: BranchDashboardComponent,
      children: [
          { path: "products", loadChildren: () => import(`./product/product.module`).then(m => m.ProductModule) },
          { path: "resources", loadChildren: () => import(`./resource/resource.module`).then(m => m.ResourceModule) }
      ]
  }


{
  path: ":branch", component: BranchDashboardComponent,
  children: [
      { path: "products", loadChildren: () => import(`./product/product.module`).then(m => m.ProductModule) },
      { path: "resources", loadChildren: () => import(`./resource/resource.module`).then(m => m.ResourceModule) }
  ]
}


, loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule), canActivate: [AuthGuard] },


*/