import { Component, OnInit, inject, Input } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, user, User, signOut, FacebookAuthProvider } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NgxSpinnerService } from "ngx-spinner"


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

  @Input() dashboardLink = true

  googleAuth: GoogleAuthProvider
  user
  idToken

  provider: 'unknown' | 'google' | 'facebook' | 'email' = 'unknown'

  constructor(protected router: Router, protected authSvc: AuthService, protected spinner: NgxSpinnerService) {


    getRedirectResult(this.auth).then(result => {
      console.warn('getRedirectResult resolved')
      console.warn(result)
    }).catch((error) => {
      // Handle Errors here.
      console.error('getRedirectResult ERROR')
      console.error(error)
    });

  }


  ngOnInit() {

    //this.auth.

    this.googleAuth = new GoogleAuthProvider()
    this.googleAuth.addScope('https://www.googleapis.com/auth/contacts.readonly')


    /* 
     */
  }

  clearCache() {

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

    this.authSvc.redirectEnabled = false

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
        prov.setCustomParameters({ prompt: 'select_account', scope: 'openid profile email' });
        break

      case 'email':
        return null

    }

    /*  First Facebook was not working => implemented signInWithRedirect()
    But after changing some settings in Facebook dev console the signInWithPopup() appears to be working

     
        await signInWithRedirect(this.auth, prov).then(result => {
    
          console.warn('signInWithRedirect resolved')
          console.warn(result)
        })
    
        return
    */





    /**
     *  Copied from:
     * 
     *  https://stackoverflow.com/questions/75918184/angularfire-signinwithredirect-and-getredirectresult-not-working
     * 
     */



    /*
    signInWithPopup does not work for Facebook on mobile devices
    */

    let me = this

    me.spinner.show()


    const credentials = await signInWithPopup(this.auth, prov).then(async (userCredentials) => {
      this.user = userCredentials.user;
      console.error(this.user)

      this.idToken = await this.user.getIdToken();
      //return of(this.user);

      console.log(this.idToken)

      return userCredentials
    }).catch(error => {
      console.error('signInWithPopup error catched')
      console.log(error)

    }).finally(() => {

      me.spinner.hide()

    })

    console.warn(credentials)

    return credentials


  }




}
