import { Component, TemplateRef  } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'ngx-altea-toasts',
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.scss'],
  host: { class: 'toast-container position-fixed top-0 end-0 p-3', style: 'z-index: 1200' }
})
export class ToastsComponent {

  constructor(protected dashboardSvc: DashboardService) {

  }

  isTemplate(toast: any) {
		return toast.textOrTpl instanceof TemplateRef;
	}
}
