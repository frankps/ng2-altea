import { Component } from '@angular/core';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'ngx-altea-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'altea-velzon-admin';

  constructor(private localeService: BsLocaleService) {
    this.localeService.use('nl-be');

  }
}
