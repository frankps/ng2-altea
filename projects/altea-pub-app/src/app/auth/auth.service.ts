import { Injectable, inject } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, authState } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService, UserService } from 'ng-altea-common';
import * as altea from 'ts-altea-model';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  auth: Auth = inject(Auth);
  authState$ = authState(this.auth);

  fbUser$ = user(this.auth);
  fbUser

  user: altea.User
  userId: string

  /**
   *  if user is also a human resource
   */
  resource: altea.Resource
  resourceId: string

  /** resource id of human resource + all ids of resource groups it belongs to */
  resourceIds: string[] = []


  userSubscription: Subscription;
  authStateSubscription: Subscription;

  constructor(protected router: Router, protected userSvc: UserService, protected resourceSvc: ResourceService) {

  }


  init() {

    // https://github.com/angular/angularfire/blob/HEAD/docs/auth.md#authentication

    this.authStateSubscription = this.authState$.subscribe(async (aUser: User | null) => {
      //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
      console.error('authState$ CHANGES')
      console.log(aUser);

      this.fbUser = aUser


      if (aUser) {

        this.user = await this.userSvc.getByUid(aUser.uid)

        if (!this.user) {
          this.user = await this.createUser$(aUser)
          console.log('User NOT found!')
          console.warn(this.user)
        } else {
          console.log('User found!')
          console.warn(this.user)
        }

        this.userId = this.user.id

        await this.loadResources(this.user.id)


        console.error('forwarding user!')
        //   this.router.navigate(['branch', 'aqua', 'menu'])
        this.router.navigate(['staff', 'dashboard'])

      } else {
        this.router.navigate(['auth', 'sign-in'])
      }
    })

  }

  async createUser$(firebaseUser: User): Promise<altea.User> {

    let user = new altea.User()

    user.uid = firebaseUser.uid

    user.prov = 'google'
    user.provEmail = firebaseUser.email
    user.email = firebaseUser.email

    let res = await this.userSvc.create$(user)

    console.error(res)
    return res.object
  }


  async loadResources(userId: string) {

    console.warn('Load resources')

    const query = new DbQuery()
    //  query.select('id', 'name')
    query.and('userId', QueryOperator.equals, userId)
    query.include('groups')

    this.resource = await this.resourceSvc.queryFirst$(query)

    console.warn(this.resource)

    this.resourceIds = []

    if (this.resource) {

      this.resourceId = this.resource.id

      if (Array.isArray(this.resource.groups))
        this.resourceIds = this.resource.groups.map(lnk => lnk.groupId)

      this.resourceIds.push(this.resource.id)
    }

    console.warn('resourceIds:', this.resourceIds)

  }





}
