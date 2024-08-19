import { Component, OnInit, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, signOut, FacebookAuthProvider } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * https://github.com/angular/angularfire/blob/HEAD/docs/auth.md#authentication
 * 
 */

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  auth: Auth = inject(Auth);


  googleAuth: GoogleAuthProvider
  user
  idToken

  provider: 'unknown' | 'google' | 'facebook' | 'email' = 'unknown'

  constructor(protected router: Router) {

  }


  ngOnInit() {

    //this.auth.

    this.googleAuth = new GoogleAuthProvider()

  }

  appSignOut() {

    return signOut(this.auth)


  }

  toDashboard() {

    this.router.navigate(['branch', 'aqua', 'menu'])

  }

  googleSignIn() {


    /**
     *  Copied from:
     * 
     *  https://stackoverflow.com/questions/75918184/angularfire-signinwithredirect-and-getredirectresult-not-working
     * 
     */


    return signInWithPopup(this.auth, new FacebookAuthProvider()).then(async (userCredentials) => {
      this.user = userCredentials.user;
      console.error(this.user)

      this.idToken = await this.user.getIdToken();
      return of(this.user);
    });


  }


  async signIn(provider: 'google' | 'facebook' | 'email') {

    this.provider = provider

    let prov

    switch (provider) {

      case 'google':
        prov = new GoogleAuthProvider()
        break

      case 'facebook':
        prov = new FacebookAuthProvider()
        break

      case 'email':
        return null
      
    }


    /**
     *  Copied from:
     * 
     *  https://stackoverflow.com/questions/75918184/angularfire-signinwithredirect-and-getredirectresult-not-working
     * 
     */


    const credentials = await signInWithPopup(this.auth, prov).then(async (userCredentials) => {
      this.user = userCredentials.user;
      console.error(this.user)

      this.idToken = await this.user.getIdToken();
      //return of(this.user);

      return userCredentials
    });

    console.warn(credentials)

    return credentials


  }




}
