import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, OrderUiState, SessionService } from 'ng-altea-common';
import { combineLatest } from 'rxjs';


// http://localhost:4350/branch/aqua/open/cerelift-pro/option
// http://localhost:4350/branch/aqua/open/cerelift-pro?6extra=1
// http://localhost:4350/branch/aqua/open/cerelift-pro/extra=a  
// http://localhost:4350/branch/aqua/open/cerelift-pro/extra:a%7Cother:b




// https://book.birdy.life/branch/aqua/open/cerelift-pro/6extra:1
// https://book.birdy.life/branch/aqua/open/cerelift-pro?6extra=1

// https://chatgpt.com/g/g-p-67657b1808c48191bcf174d5a196fb88-programming/c/6849e4b9-e16c-800b-9127-c73f42118a2c
// implement quary parameters for options?

@Component({
  selector: 'app-open',
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.scss']
})
export class OpenComponent implements OnInit {
  productSlug: string | null = null;

  constructor(private route: ActivatedRoute, protected sessionSvc: SessionService, protected router: Router, protected orderMgrSvc: OrderMgrUiService) { }

  ngOnInit() {
    

    combineLatest({
      params: this.route.paramMap,
      queryParams: this.route.queryParams
    }).subscribe(async ({ params, queryParams }) => {
      this.productSlug = params.get('slug');
      console.error('Route params:', this.productSlug);
      console.error('Query params:', queryParams);

      await this.createOrder(this.productSlug, queryParams)
      // Now you can proc
      // eed with both params and queryParams available
      // await this.createOrder(this.slug);
    });



    //await this.createOrder(slug)
  }




  async createOrder(productSlug: string, params?: any) {

    console.error('createOrder')
    await this.orderMgrSvc.newOrder(OrderUiMode.newOrder)
    //  await this.orderMgrSvc.loadProductBySlug(productSlug)
    await this.orderMgrSvc.openProductBySlug(productSlug, params)
    this.orderMgrSvc.changeUiState(OrderUiState.browseCatalog)
    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'order-line'])
  }

}


