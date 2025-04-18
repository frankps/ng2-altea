import { Component, OnInit, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, signOut } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';


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


  ngOnInit() {

    //this.auth.

    this.googleAuth = new GoogleAuthProvider()

  }

  appSignOut() {

    return signOut(this.auth)


  }

  googleSignIn() {


    /**
     *  Copied from:
     * 
     *  https://stackoverflow.com/questions/75918184/angularfire-signinwithredirect-and-getredirectresult-not-working
     * 
     */
  
    return signInWithPopup(this.auth, new GoogleAuthProvider()).then(async (userCredentials) => {
      this.user = userCredentials.user;
      console.error(this.user)

      this.idToken = await this.user.getIdToken();
      return of(this.user);
    });
    

  //  return signInWithRedirect(this.auth, new GoogleAuthProvider());
  }


}
