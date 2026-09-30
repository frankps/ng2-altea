import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { captureAdParams } from './app/tracking/ad-params';

/** Keep ad click ids (fbclid, UTMs) before Angular can redirect them away. Never throws. */
captureAdParams();
  

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
