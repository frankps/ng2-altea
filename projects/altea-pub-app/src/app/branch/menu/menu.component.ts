import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from 'ng-altea-common';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  constructor(protected sessionSvc: SessionService, protected router: Router) { }


  menuClicked(menuItem) {

    console.error(menuItem)

    if (!menuItem)
      return

    //this.router.navigate(['/order'])

    switch (menuItem.code) {

      case 'new-reserv':
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'order'])
        break

      case 'use-gift':
        this.router.navigate(['/branch', this.sessionSvc.branchUnique, 'use-gift'])
        break

  

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
