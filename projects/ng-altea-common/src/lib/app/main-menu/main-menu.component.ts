import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TranslationService } from 'ng-common'
import { SessionService } from '../../session.service';
import { Branch } from 'ts-altea-model';


@Component({
  selector: 'altea-lib-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit {

  /** translated labels */
  lbl = {}

  branch: Branch

  @Output() select: EventEmitter<string> = new EventEmitter();


  menu = [
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
  ]

  constructor(protected translationSvc: TranslationService, protected sessionSvc: SessionService) {

  }

  selectMenuItem(menuItem: any) {
    console.error(menuItem)

    if (menuItem)
      this.select.emit(menuItem.code)
  }


  async ngOnInit() {

    console.log(this.lbl)

    this.branch = await this.sessionSvc.branch$()

    const lbl = this.lbl

    await this.translationSvc.getTranslations$(['app.menu.title'], lbl, 'app.')

    if (lbl['menu.title'] && this.branch)
      lbl['menu.title'] = lbl['menu.title'].replace('[branch]', this.branch.name)


    console.error(this.lbl)

  }


}
