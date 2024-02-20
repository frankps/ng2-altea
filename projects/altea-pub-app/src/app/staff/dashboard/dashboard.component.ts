import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ObjectHelper } from 'ts-common';
import { instanceToPlain, plainToInstance } from "class-transformer";
import { SessionService } from 'ng-altea-common';

export class AppItem {
  uid = ObjectHelper.newSmallGuid()
  name = 'happy'
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private firestore: Firestore = inject(Firestore)

  items$: Observable<any[]>;
  itemCollection: CollectionReference;

  constructor(protected sessionSvc: SessionService) {

  }


  ngOnInit() {

    this.itemCollection = collection(this.firestore, 'branches', this.sessionSvc.branchId, 'updates')

    this.items$ = collectionData(this.itemCollection);


    this.items$.subscribe(item => {

      console.warn('Update retrieved!')
      console.warn(item)
    })

  }

  async addItem() {

    let guid = ObjectHelper.newSmallGuid()

    const item = {
      uid: guid,
      name: guid,
      timestamp: serverTimestamp()
    }

    const docRef = await addDoc(this.itemCollection, item)

    // const docRef = await updateDoc(this.itemCollection, item)

    //updateDoc()
    console.log(`New id: ${docRef.id}`)

  }


  async updateItem() {

    let path = ''
    const docRef = doc(this.firestore, 'branches', 'aqua', 'updates', 'task')   // this.sessionSvc.branchId

    await updateDoc(docRef, { timestamp: ObjectHelper.newSmallGuid() })   // serverTimestamp()
  }
}
