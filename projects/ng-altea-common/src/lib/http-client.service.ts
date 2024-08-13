import { HttpClient } from '@angular/common/http';
import { Observable, map, Subject, take } from "rxjs";



export class HttpClientService {

    constructor(protected http: HttpClient, protected httpServer: string) {
  
    }
  
    async delete$<T>(pageUrl: string): Promise<T> {
  
      const me = this
  
      return new Promise<any>(function (resolve, reject) {
  
        const fullUrl = `${me.httpServer}/${pageUrl}`
  
        me.http.delete(fullUrl).pipe(take(1)).subscribe(res => {
          resolve(res)
        })
  
      })
    }
  
  
    async get$<T>(pageUrl: string): Promise<T> {
  
      const me = this
  
      return new Promise<any>(function (resolve, reject) {
  
        const fullUrl = `${me.httpServer}/${pageUrl}`
  
        me.http.get(fullUrl).pipe(take(1)).subscribe(res => {
          resolve(res)
        })
  
      })
    }
  
    async post$<T>(pageUrl: string, body: any): Promise<T> {
  
      const me = this
  
      return new Promise<any>(function (resolve, reject) {
  
        const fullUrl = `${me.httpServer}/${pageUrl}`
  
        me.http.post<any>(fullUrl, body).pipe(take(1)).subscribe(res => {
          resolve(res)
        })
  
      })
  
    }
  
  
  }