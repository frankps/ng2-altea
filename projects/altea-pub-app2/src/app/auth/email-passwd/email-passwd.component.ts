import { Component, Injectable, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, authState, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from '@angular/fire/auth';

/** https://firebase.google.com/docs/auth/web/password-auth
 * 
 */

@Component({
  selector: 'app-email-passwd',
  templateUrl: './email-passwd.component.html',
  styleUrls: ['./email-passwd.component.scss']
})
export class EmailPasswdComponent {
  auth: Auth = inject(Auth)

  email: string
  passwd: string

  error

  constructor(protected authSvc: AuthService) {

  }

  resetPassword() {
   
    sendPasswordResetEmail(this.auth, this.email).then((result) => {
     
      
      console.error(result)
      // ...
    })
    .catch((error) => {

      this.processError(error)

    });
  }

  login() {

    // sendPasswordResetEmail

    signInWithEmailAndPassword(this.auth, this.email, this.passwd)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        // ...
      })
      .catch((error) => {

        this.processError(error)

      });

  }


  createAccount() {

    createUserWithEmailAndPassword(this.auth, this.email, this.passwd)
      .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        console.warn(userCredential)
      })
      .catch((error) => {

        this.processError(error)

      })



    //this.authSvc.createUser$
  }

  processError(error) {
    this.error = error

    const errorCode = error.code;
    const errorMessage = error.message;

    console.error(error)

  }

}
