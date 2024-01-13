import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  constructor(protected router: Router) {}


  menuClicked(menuCode) {

    console.error(menuCode)

    this.router.navigate(['/order'])



  }
}
