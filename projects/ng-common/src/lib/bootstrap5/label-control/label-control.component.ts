import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-altea-label-control',
  templateUrl: './label-control.component.html',
  styleUrls: ['./label-control.component.scss'],
})
export class LabelControlComponent {


  vatPcts = [6, 12, 21]
  vatPct = 6


  @Input() class = ''


  @Input() layout = 'floating'

  @Input() trans = true
  @Input() label = ''
  @Input() for = ''

  @Input() help = ''
  @Input() showHelp = true

  @Input() labelCol = 'col-4'
  @Input() controlCol = 'col-8'

  // @Input() extraHelp: TemplateRef<any>
  // showExtraHelp: boolean = false

  extraCss = "d-flex justify-content-end"

  // constructor(protected logSvc: CommonNg.LogService) { }


  // toggleExtraHelp() {

  //   this.showExtraHelp = !this.showExtraHelp

  //   this.logSvc.logEvent('show_extra_help', { for: this.for })

  //   console.log(this.showExtraHelp)
  // }
}
