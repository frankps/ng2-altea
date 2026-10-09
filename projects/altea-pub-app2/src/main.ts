import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { captureAdParams } from './app/tracking/ad-params';
import { captureTouch } from './app/tracking/acquisition-capture';

/** Keep ad click ids (fbclid, UTMs) before Angular can redirect them away. Never throws. */
captureAdParams();

/** Keep the ad click for 90 days (localStorage), so it can be stored on the order (Order.attr). Never throws. */
captureTouch();
  

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
