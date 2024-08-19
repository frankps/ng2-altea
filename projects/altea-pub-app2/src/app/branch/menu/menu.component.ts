import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMgrUiService, OrderUiMode, OrderUiState, SessionService } from 'ng-altea-common';
import { AuthService } from '../../auth/auth.service';
import { MenuItem } from 'ts-altea-model';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  auth: Auth = inject(Auth)

  menu = [
    new MenuItem('login', 'loggedOff'),
    new MenuItem('new-reserv', 'always'),
    new MenuItem('use-gift', 'always'),
    new MenuItem('buy-gift', 'always'),
    new MenuItem('my-subs', 'loggedOn'),
    new MenuItem('my-orders', 'loggedOn'),
    new MenuItem('demo-orders', 'always'),
    new MenuItem('logout', 'loggedOn'),
  ]

  constructor(protected sessionSvc: SessionService, protected router: Router, protected orderMgrSvc: OrderMgrUiService,
    protected authSvc: AuthService
  ) { }

  async menuClicked(menuItem) {

    console.error(menuItem)

    if (!menuItem)
      return


    switch (menuItem.code) {

      case 'login':
        this.router.navigate(['/auth', 'sign-in'])
        break

      case 'logout':
        return signOut(this.auth)
        break


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
