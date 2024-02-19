import { Injectable, inject } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, authState } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'ng-altea-common';
import * as altea  from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  auth: Auth = inject(Auth);
  authState$ = authState(this.auth);

  user$ = user(this.auth);
  user

  userSubscription: Subscription;
  authStateSubscription: Subscription;

  constructor(protected router: Router, protected userSvc: UserService) {

  }


  init() {

    // https://github.com/angular/angularfire/blob/HEAD/docs/auth.md#authentication
    /*
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      //handle user state changes here. Note, that user will be null if there is no currently logged in user.
      //console.warn(aUser);
      console.error('user$ CHANGES')
      console.log(aUser);
      this.user = aUser
    }) */


    this.authStateSubscription = this.authState$.subscribe(async (aUser: User | null) => {
      //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
      console.error('authState$ CHANGES')
      console.log(aUser);

      this.user = aUser


      if (aUser) {

        let alteaUser = await this.userSvc.getByUid(aUser.uid)

        if (!alteaUser) {
          alteaUser = await this.createUser$(aUser)
          console.log('User NOT found!')
          console.warn(alteaUser)
        } else {
          console.log('User found!')
          console.warn(alteaUser)
        }
          
        console.error('forwarding user!')
        this.router.navigate(['branch', 'aqua', 'menu'])
      } else {
        this.router.navigate(['auth', 'sign-in'])
      }
    })

  }





  async createUser$(firebaseUser: User) : Promise<altea.User> {

    let user = new altea.User()

    user.uid = firebaseUser.uid

    user.prov = 'google'
    user.provEmail = firebaseUser.email
    user.email = firebaseUser.email

    let res = await this.userSvc.create$(user)

    console.error(res)
    return res.object
  }



}
