import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, OrderUiState, SessionService } from 'ng-altea-common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {


  menu = [

    {
      code: 'new-reserv',
      loggedOff: true
    },
    {
      code: 'use-gift',
      loggedOff: true
    },
    {
      code: 'buy-gift',
      loggedOff: true
    },
    {
      code: 'my-subs',
      loggedOff: false
    }
    ,
    {
      code: 'demo-orders',
      loggedOff: true
    }

    /*
    {
      code: 'my-reservs'
    },
    {
      code: 'my-subs'
    },
    {
      code: 'my-loyalty'
    } */
  ]

  constructor(protected sessionSvc: SessionService, protected router: Router, protected orderMgrSvc: OrderMgrUiService,
    protected authSvc: AuthService
  ) { }


  menuClicked(menuItem) {

    console.error(menuItem)

    if (!menuItem)
      return


    switch (menuItem.code) {

      case 'new-reserv':

        this.orderMgrSvc.newOrder(OrderUiMode.newOrder)
        this.orderMgrSvc.changeUiState(OrderUiState.browseCatalog)
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
        break

      /*       case 'use-gift':
              this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'use-gift'])
              break
      
            case 'buy-gift':
              this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'buy-gift'])
              break */

      case 'demo-orders':

        this.orderMgrSvc.newOrder(OrderUiMode.newOrder)
        this.orderMgrSvc.changeUiState(OrderUiState.demoOrders)
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
        break

      default:
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, menuItem.code])

    }





  }

  /*   menu = [
      {
        code: 'new-reserv'
      },
      {
        code: 'use-gift'
      },
      {
        code: 'buy-gift'
      },
      {
        code: 'my-reservs'
      },
      {
        code: 'my-subs'
      },
      {
        code: 'my-loyalty'
      }
    ] */


}
