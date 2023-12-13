import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    template: ""
  })
export class BaseComponent implements OnDestroy {
    ngUnsubscribe = new Subject<void>();
  
    ngOnDestroy(): void {
      this.ngUnsubscribe.next();
      this.ngUnsubscribe.complete();
    }
  
  }