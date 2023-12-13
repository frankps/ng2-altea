import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ngx-altea-manage-resources',
  templateUrl: './manage-resources.component.html',
  styleUrls: ['./manage-resources.component.scss'],
})
export class ManageResourcesComponent implements OnInit {

  constructor(protected route: ActivatedRoute, protected router: Router) { }

  ngOnInit() {

    // this.route.params.subscribe(params => {

    //   console.error(params)
    // })

  }

}
