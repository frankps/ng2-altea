import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  let auth: AuthService = inject(AuthService);

  console.warn(auth)


  return (auth.user) ? true : false


  /*console.warn('authGuard BLOCK')
  return false;*/ 
};
