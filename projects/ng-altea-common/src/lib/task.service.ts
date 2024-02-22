import { Injectable, inject } from '@angular/core';
import { Task } from 'ts-altea-model'
import { BackendHttpServiceBase } from'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';

import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService extends BackendHttpServiceBase<Task> {
 
  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Task, sessionSvc.backend, sessionSvc.branchUnique + '/tasks', http, `branches/${sessionSvc.branchUnique}/updates/task`)
  }

  // 'branches/aqua/updates/task'

  changeObservable() : Observable<DocumentData> {

    const taskDocRef = doc(this.firestore, 'branches', this.sessionSvc.branchUnique, 'updates', 'task')
    const taskDocData$ = docData(taskDocRef)

    return taskDocData$
  }


}  
