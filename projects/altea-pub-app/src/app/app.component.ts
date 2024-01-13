import { Component } from '@angular/core';
import { BranchService, SessionService } from 'ng-altea-common';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'altea-pub-app'


  constructor(private localeService: BsLocaleService, private branchSvc: BranchService, private sessionSvc: SessionService) {
    this.localeService.use('nl-be');


    this.branchSvc.get(this.sessionSvc.branchId).subscribe(branch => {

      this.sessionSvc.branch = branch

      console.error(branch)

    })
  
    
  }


}
