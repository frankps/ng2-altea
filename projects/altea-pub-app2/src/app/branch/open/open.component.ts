import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, OrderUiState, SessionService } from 'ng-altea-common';


// http://localhost:4350/branch/aqua/open/cerelift-pro/option
// https://book.birdy.life/branch/aqua/open/cerelift-pro/6extra:1

// https://chatgpt.com/g/g-p-67657b1808c48191bcf174d5a196fb88-programming/c/6849e4b9-e16c-800b-9127-c73f42118a2c
// implement quary parameters for options?

@Component({
  selector: 'app-open',
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.scss']
})
export class OpenComponent implements OnInit {
  slug: string | null = null;

  constructor(private route: ActivatedRoute, protected sessionSvc: SessionService, protected router: Router, protected orderMgrSvc: OrderMgrUiService) { }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      this.slug = params.get('slug');

      let options = params.get('options')

      console.error(this.slug, options)

      await this.createOrder(this.slug)
    });
  }


  async createOrder(productSlug: string) {

    console.error('createOrder')
    await this.orderMgrSvc.newOrder(OrderUiMode.newOrder)
    //  await this.orderMgrSvc.loadProductBySlug(productSlug)
    await this.orderMgrSvc.openProductBySlug(productSlug)
    this.orderMgrSvc.changeUiState(OrderUiState.browseCatalog)
    this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'orderMode', 'order-line'])
  }

}


