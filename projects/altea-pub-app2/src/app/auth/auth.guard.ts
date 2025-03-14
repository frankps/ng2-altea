import { inject } from '@angular/core';
import { CanActivateFn, RouterStateSnapshot, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  let auth: AuthService = inject(AuthService);
  // let routerState: RouterStateSnapshot = inject(RouterStateSnapshot);
  let router: Router = inject(Router);




  console.warn(auth)

  //return (auth.fbUser) ? true : false

  if (auth.fbUser)
    return true

/*   auth.redirectEnabled = true
  auth.redirect = [] */

  console.error(router.url)
  console.error(state.url)


  await router.navigate(['/auth/sign-in'], { queryParams: { returnUrl: router.url } });
  return false;

  /*console.warn('authGuard BLOCK')
  return false;*/
};
