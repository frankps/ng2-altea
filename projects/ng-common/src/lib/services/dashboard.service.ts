import { Injectable, TemplateRef, OnInit } from '@angular/core';
import * as Rx from "rxjs";
import {
  BreakpointObserver,
  BreakpointState,
  Breakpoints
} from '@angular/cdk/layout';
import { TranslateService } from '@ngx-translate/core';

export enum ToastType {
  saveSuccess = 'saveSuccess',
  saveError = 'saveError',
  saveNoChanges = 'saveNoChanges'
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  /** code of organisation, branch, ... */
  public rootPath = 'aqua'

  public showSearch?= false
  public search$: Rx.Subject<string> = new Rx.Subject<string>()

  public showAdd?= false
  public add$: Rx.Subject<void> = new Rx.Subject<void>()
  public isMobile = false

  toasts: any[] = [];

  constructor(public breakpointObserver: BreakpointObserver, private translate: TranslateService) {

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobile = true
          console.log('>>>>>>>>>>>>>>>> Is Mobile!');
        } else {
          this.isMobile = false
          console.log('>>>>>>>>>>>>>>>> Is Desktop!');
        }
      });


    // this.breakpointObserver
    //   .observe(['(min-width: 500px)'])
    //   .subscribe((state: BreakpointState) => {
    //     if (state.matches) {
    //       console.log('>>>>>>>>>>>>>>>> Viewport width is 500px or greater!');
    //     } else {
    //       console.log('>>>>>>>>>>>>>>>> Viewport width is less than 500px!');
    //     }
    //   });


  }


  // showToast(textOrTpl: string | TemplateRef<any>, options: any = {}) {
  // 	this.toasts.push({ textOrTpl, ...options });
  // }

  searchFor(searchString: string) {

    console.error(searchString)
    this.search$.next(searchString)
  }

  createNew() {
    this.add$.next()
  }

  showToast(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  showSuccessToast(text: string) {
    this.showToast(text, { classname: 'bg-success text-light', delay: 2000 })
  }

  showErrorToast(text: string) {
    this.showToast(text, { classname: 'bg-danger text-light', delay: 5000 })
  }

  showToastType(type: ToastType) {

    this.translate.get('enums.toast-type.' + type).subscribe((res: string) => {
      
      switch (type) {
        case ToastType.saveError:
          this.showErrorToast(res)
          break

        default:
          this.showSuccessToast(res)

      }
      
    
    });


  }


  removeToast(toast: any) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  clearToasts() {
    this.toasts.splice(0, this.toasts.length);
  }



}
