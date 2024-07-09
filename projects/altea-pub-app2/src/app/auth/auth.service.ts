import { Injectable, inject } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, user, User, authState, signOut } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService, UserService } from 'ng-altea-common';
import * as altea from 'ts-altea-model';
import { ArrayHelper, DbQuery, QueryOperator } from 'ts-common';
import { NgxSpinnerService } from 'ngx-spinner';
import { Exclude, Type, Transform, plainToInstance, instanceToPlain } from "class-transformer";
import { JsonPipe } from '@angular/common';

/*

, protected router: Router
router, 
*/


export class AuthLocalStorage {
  @Type(() => altea.User)
  user: altea.User

  @Type(() => altea.Resource)
  resource: altea.Resource

  constructor(user: altea.User, resource: altea.Resource) {
    this.user = user
    this.resource = resource
  }

}


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

  constructor(protected router: Router, protected userSvc: UserService, protected resourceSvc: ResourceService, protected spinner: NgxSpinnerService) {

  }

  clearUserData() {
    this.fbUser = undefined
    this.user = undefined
    this.userId = undefined
    this.resource = undefined
    this.resourceId = undefined
  }


  async logout() {

    var signOutResult = await signOut(this.auth)

    console.error(signOutResult)

    if (this.fbUser) {
      let storageKey = `user-${this.fbUser.uid}`
      let cachedInfo = localStorage.removeItem(storageKey)

    }

    this.clearUserData()

  }

  loggedOn(): boolean {

    return (this.fbUser != null && this.fbUser != undefined)
  }

  init() {

    // https://github.com/angular/angularfire/blob/HEAD/docs/auth.md#authentication

    this.authStateSubscription = this.authState$.subscribe(async (firebaseUser: User | null) => {
      //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
      console.error('authState$ CHANGES')
      console.log(firebaseUser);

      this.fbUser = firebaseUser

      if (firebaseUser == null)
        this.clearUserData()

      if (firebaseUser) {

        let newUser = false
        this.spinner.show()

        /*         try {
                  
                } */

        try {

          let storageKey = `user-${firebaseUser.uid}`
          let cachedInfo = localStorage.getItem(storageKey)

          if (cachedInfo) {

            cachedInfo = JSON.parse(cachedInfo)
            let cachedAuthInfo: AuthLocalStorage = plainToInstance(AuthLocalStorage, cachedInfo)

            console.log('retrieved from cache!', cachedAuthInfo)


            this.user = cachedAuthInfo.user
            this.resource = cachedAuthInfo.resource


          } else {
            this.user = await this.userSvc.getByUid(firebaseUser.uid)

            if (!this.user) newUser = true


            if (newUser) {
              this.user = await this.createUser$(firebaseUser)
              console.log('User NOT found!')
              console.warn(this.user)
            } else {
              console.log('User found!')
              console.warn(this.user)
            }

            this.resource = await this.getResource(this.user.id)

            let cachedAuthInfo = new AuthLocalStorage(this.user, this.resource)
            localStorage.setItem(storageKey, JSON.stringify(cachedAuthInfo))

          }

          this.userId = this.user.id
          this.setResourceData(this.resource)

          const authLocalStorage = new AuthLocalStorage(this.user, this.resource)


          console.error('forwarding user!')


          // to test
          this.router.navigate(['/auth', 'profile'])

          /*
          if (newUser)
            this.router.navigate(['/auth', 'profile'])
          else
            this.router.navigate(['branch', 'aqua', 'menu'])
          */

          // this.router.navigate(['staff', 'dashboard'])

        } finally {

          this.spinner.hide()

        }




      } else {
      //  this.router.navigate(['auth', 'sign-in'])
      }
    })

  }

  async createUser$(firebaseUser: User): Promise<altea.User> {

    let user = new altea.User()

    user.uid = firebaseUser.uid

    if (ArrayHelper.NotEmpty(firebaseUser.providerData)) {

      const providerData = firebaseUser.providerData[0]

      if (firebaseUser.providerData.length > 1) // we expect only 1 item in array
        user.prvOrig = firebaseUser.providerData
      else
        user.prvOrig = providerData



      switch (providerData.providerId) {

        case 'facebook.com':
          user.prov = 'facebook'

          const provInfo = new altea.ProviderInfo()
          provInfo.email = providerData.email
          provInfo.id = providerData.uid

          user.prv = provInfo

          /*           user.provEmail = providerData.email
                    user.provId = providerData.uid */

          user.email = providerData.email

          if (providerData.displayName) {
            let names = providerData.displayName.split(' ')
            user.first = names[0]
            names.splice(0, 1)
            user.last = names.join(' ')
          }

          break

        default:
          user.prov = 'google'
          user.provEmail = firebaseUser.email
          user.email = firebaseUser.email

      }


    }



    let res = await this.userSvc.create$(user)

    console.error(res)
    return res.object
  }


  async getResource(userId: string): Promise<altea.Resource> {

    console.warn('Load resources')

    const query = new DbQuery()
    //  query.select('id', 'name')
    query.and('userId', QueryOperator.equals, userId)
    query.include('groups')

    const resource = await this.resourceSvc.queryFirst$(query)

    return resource


  }



  setResourceData(resource: altea.Resource) {

    console.warn('setResourceData', this.resource)

    this.resourceId = undefined
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
