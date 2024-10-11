import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription, of } from 'rxjs';
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
  auth: Auth = inject(Auth)
  authState$ = authState(this.auth)

  fbUser$ = user(this.auth);
  fbUser = undefined

  user: altea.User = undefined
  userId: string = undefined

  user$: BehaviorSubject<altea.User> = new BehaviorSubject<altea.User>(null)



  /**
   *  if user is also a human resource
   */
  resource: altea.Resource
  resourceId: string

  /** resource id of human resource + all ids of resource groups it belongs to */
  resourceIds: string[] = []

  //userSubscription: Subscription;
  authStateSubscription: Subscription;

  redirectEnabled = true
  redirect: string[] = null

  constructor(protected router: Router, protected route: ActivatedRoute, protected userSvc: UserService, protected resourceSvc: ResourceService, protected spinner: NgxSpinnerService) {

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

    return (this.fbUser != null && this.fbUser != undefined && this.user != undefined)
  }

  init() {

    const me = this
    // https://github.com/angular/angularfire/blob/HEAD/docs/auth.md#authentication

    me.authStateSubscription = me.authState$.subscribe(async (firebaseUser: User | null) => {
      //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
      console.error('authState$ CHANGES')
      console.log(firebaseUser);

      me.fbUser = firebaseUser

      if (firebaseUser == null) {
        me.clearUserData()
        return
      }

      if (firebaseUser) {

        let newUser = false
        me.spinner.show()

        /*         try {
                  
                } */

        try {

          let storageKey = `user-${firebaseUser.uid}`
          let cachedInfo = localStorage.getItem(storageKey)

          if (cachedInfo) {

            cachedInfo = JSON.parse(cachedInfo)
            let cachedAuthInfo: AuthLocalStorage = plainToInstance(AuthLocalStorage, cachedInfo)

            console.log('retrieved from cache!', cachedAuthInfo)

            me.user = cachedAuthInfo.user
            me.resource = cachedAuthInfo.resource


          } else {
            me.user = await me.userSvc.getByUid(firebaseUser.uid)

            if (!me.user) newUser = true


            if (newUser) {
              me.user = await me.createUser$(firebaseUser)
              console.log('User NOT found!')
              console.warn(me.user)
            } else {
              console.log('User found!')
              console.warn(me.user)
            }

            me.resource = await me.getResource(me.user.id)

            let cachedAuthInfo = new AuthLocalStorage(me.user, me.resource)
            localStorage.setItem(storageKey, JSON.stringify(cachedAuthInfo))

          }

          me.userId = me.user.id
          me.setResourceData(me.resource)

          me.user$.next(me.user)

          //const authLocalStorage = new AuthLocalStorage(me.user, me.resource)


          console.error('forwarding user!')

          let originalUrl = me.route.snapshot['_routerState'].url
          console.error(originalUrl)

          let redirected = false

          //me.redirectEnabled = true

          if (me.redirectEnabled) {
            if (me.redirect) {
              let redirect = me.redirect
              //me.redirect = null

              console.warn(`Redirecting to: ${redirect}`)

              me.router.navigate(redirect)
              redirected = true

            } else if (originalUrl && originalUrl != "/auth/sign-in") {

            
              // introduced to bring back user to original URL

              console.warn(`Redirecting to: ${originalUrl}`)
              if (originalUrl[0] == '/')
                originalUrl = originalUrl.substring(1)
              const pathItems = originalUrl.split('/')

              me.router.navigate(pathItems)
              redirected = true

            }
          }


          if (!redirected) {

            console.warn(`Not yet redirected!`)

            if (newUser || !me.user.first)
              me.router.navigate(['/auth', 'profile'])
            else
              me.router.navigate(['branch', 'aqua', 'menu'])
          }

          // this.router.navigate(['staff', 'dashboard'])

        } finally {

          me.spinner.hide()

        }




      } else {
        //  this.router.navigate(['auth', 'sign-in'])
      }
    })

  }


  /** to be used when user object has changed in other part of the application: updates user in authService and also cached version in local storage */
  async refreshUser(user: altea.User) {

    this.user = user

    let storageKey = `user-${this.fbUser.uid}`
    this.resource = await this.getResource(user.id)

    let cachedAuthInfo = new AuthLocalStorage(this.user, this.resource)
    localStorage.setItem(storageKey, JSON.stringify(cachedAuthInfo))
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

          /* user.provEmail = providerData.email
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
