import { Component, OnInit, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, signOut } from '@angular/fire/auth';
import { Subscription, of } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.scss']
})
export class SignOutComponent implements OnInit {
  auth: Auth = inject(Auth);

  constructor(protected authSvc: AuthService) {

  }

  ngOnInit() {


    




  }

  logOut() {
    this.authSvc.logout()
  }


}
