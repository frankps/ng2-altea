import { Route } from '@angular/router';
import { LayoutComponent } from './velzon/layouts/layout.component';
import { AppComponent } from './app.component';
import { DemoComponent } from './demo/demo/demo.component';

export const appRoutes: Route[] = [{
  path: ':branch', component: LayoutComponent,
  //loadChildren: () => import('./resource/resource.module').then(m => m.ResourceModule) 
  children: [
    { path: "catalog", loadChildren: () => import(`./product/product.module`).then(m => m.ProductModule) },
    { path: "resources", loadChildren: () => import(`./resource/resource.module`).then(m => m.ResourceModule) },
    { path: "templates", loadChildren: () => import(`./template/template.module`).then(m => m.TemplateModule) },
    { path: "contacts", loadChildren: () => import(`./contact/contact.module`).then(m => m.ContactModule) },
    { path: "orders", loadChildren: () => import(`./order/order.module`).then(m => m.OrderModule) },
    { path: "calendar", loadChildren: () => import(`./calendar/calendar.module`).then(m => m.CalendarModule) },
    { path: "gifts", loadChildren: () => import(`./gift/gift.module`).then(m => m.GiftModule) },
    { path: "subscriptions", loadChildren: () => import(`./subscription/subscription.module`).then(m => m.SubscriptionModule) },
    { path: "order", loadChildren: () => import(`./order-mgr/order-mgr.module`).then(m => m.OrderMgrModule) },
    { path: "demo", component: DemoComponent },
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