import { Component, inject, OnInit } from '@angular/core';
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
export class MenuComponent implements OnInit {
  auth: Auth = inject(Auth)

  initialized = false

  menu = []

  constructor(protected sessionSvc: SessionService, protected router: Router, protected orderMgrSvc: OrderMgrUiService,
    protected authSvc: AuthService
  ) { }

  ngOnInit(): void {

    this.menu = [
      new MenuItem('login', 'loggedOff'),
      new MenuItem('new-reserv', 'always'),

      new MenuItem('use-gift', 'always'),
      new MenuItem('buy-gift', 'always'),
      new MenuItem('last-minutes', 'always'),
      new MenuItem('my-subs', 'loggedOn'),
      new MenuItem('my-orders', 'loggedOn'),
      new MenuItem('logout', 'loggedOn'),
      new MenuItem('demo-orders', 'loggedOn', 'test')  //'loggedOn', 'test')
    ]

    // new MenuItem('demo-orders', 'always'),
    this.initialized = true
  }

  async menuClicked(menuItem) {

    console.error(menuItem)

    if (!menuItem)
      return


    switch (menuItem.code) {

      case 'login':
        this.router.navigate(['/auth', 'sign-in'])
        break

      case 'logout':
        await this.authSvc.logout()
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

/*         this.router.navigate(['/branch', 'aqua' , 'pay-finished'],
          { queryParams: { orderId: '1fc92e80-81e0-404f-9dd3-6dbc8c543f30', sessionId: 'cs_test_a1mBsBKED9JEbO9PanUx34TTwJb5ZUInTtBH2vQ4yb3xdhQa7eou0rbyMw' }})
 */

        this.orderMgrSvc.newOrder(OrderUiMode.newOrder)
        this.orderMgrSvc.changeUiState(OrderUiState.demoOrders)
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
        break

      default:
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, menuItem.code])

    }

  }



}
