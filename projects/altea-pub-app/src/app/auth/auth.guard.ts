import { inject } from '@angular/core';
import { CanActivateFn, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  let auth: AuthService = inject(AuthService);
  // let routerState: RouterStateSnapshot = inject(RouterStateSnapshot);
  let router: Router = inject(Router);


  console.warn(auth)


  //return (auth.fbUser) ? true : false

  if (auth.fbUser)
    return true

  router.navigate(['/auth/sign-in'], { queryParams: { returnUrl: router.url } });
  return false;

  /*console.warn('authGuard BLOCK')
  return false;*/
};
