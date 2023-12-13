import { Component, OnInit } from '@angular/core';
import { EventService } from '../../core/services/event.service';
import { DATA_PRELOADER, LAYOUT_MODE, LAYOUT_POSITION, LAYOUT_WIDTH, SIDEBAR_COLOR, SIDEBAR_SIZE, SIDEBAR_VIEW, TOPBAR } from '../layout.model';

@Component({
  selector: 'app-two-column',
  templateUrl: './two-column.component.html',
  styleUrls: ['./two-column.component.scss']
})

/**
 * TwoColumnComponent
 */
export class TwoColumnComponent implements OnInit {

  constructor(private eventService: EventService) { }
  isCondensed = false;

  ngOnInit(): void {
    document.documentElement.setAttribute('data-layout', 'twocolumn');
    document.documentElement.setAttribute('data-topbar', TOPBAR);
    document.documentElement.setAttribute('data-sidebar', SIDEBAR_COLOR);
    document.documentElement.setAttribute('data-sidebar-size', SIDEBAR_SIZE);
    document.documentElement.setAttribute('data-layout-style', SIDEBAR_VIEW);
    document.documentElement.setAttribute('data-bs-theme', LAYOUT_MODE);
    document.documentElement.setAttribute('data-layout-width', LAYOUT_WIDTH);
    document.documentElement.setAttribute('data-layout-position', LAYOUT_POSITION);
    document.documentElement.setAttribute('data-preloader', DATA_PRELOADER);

    if (document.body.getAttribute('layout') == "twocolumn") {
      if (document.documentElement.clientWidth <= 767) {
        this.eventService.broadcast('changeLayout', 'vertical');
      } else {
        this.eventService.broadcast('changeLayout', 'twocolumn');
        document.body.classList.remove('twocolumn-panel');
        document.body.classList.remove('vertical-sidebar-enable');
      }
    }
  }

  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    document.body.classList.toggle('twocolumn-panel');
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
    const rightBar = document.getElementById('theme-settings-offcanvas');
    if (rightBar != null) {
      rightBar.classList.toggle('show');
      rightBar.setAttribute('style', "visibility: visible;");
    }
  }

  onResize(event: any) {
    if (document.body.getAttribute('layout') == "twocolumn") {
      if (event.target.innerWidth <= 767) {
        this.eventService.broadcast('changeLayout', 'vertical');
      } else {
        this.eventService.broadcast('changeLayout', 'twocolumn');
        document.body.classList.remove('twocolumn-panel');
        document.body.classList.remove('vertical-sidebar-enable');
      }
    }
  }

  isTwoColumnLayoutRequested() {
    return 'twocolumn' === document.documentElement.getAttribute('data-layout');

  }

  issemiboxLayoutRequested() {
    return 'semibox' === document.documentElement.getAttribute('data-layout');
  }

}
