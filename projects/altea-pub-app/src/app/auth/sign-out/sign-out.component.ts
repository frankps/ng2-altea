import { Component, OnInit, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, signOut } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';

@Component({
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.scss']
})
export class SignOutComponent implements OnInit {
  auth: Auth = inject(Auth);


  ngOnInit() {

    //this.auth.

    signOut(this.auth)

  }
}
