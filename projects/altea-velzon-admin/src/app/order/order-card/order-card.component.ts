import { Component, Input } from '@angular/core';
import { Order, Resource, ResourceTypeIcons, ResourceTypeCircleIcons } from 'ts-altea-model';
import { UIOrder } from '../order-grid/order-grid.component';
import { SessionService } from 'ng-altea-common'
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
})
export class OrderCardComponent {

  order: Order
  resources: Resource[]
  ResourceTypeIcons = ResourceTypeIcons

  @Input() set uiOrder(value: UIOrder) {

    if (!value)
      return

    this.order = value.order
    this.resources = value.resources

  }

  constructor(protected sessionSvc: SessionService, protected router: Router) {
  }

  openOrder(orderId: string) {

    this.router.navigate(['/aqua/order', orderId])


  }

}
