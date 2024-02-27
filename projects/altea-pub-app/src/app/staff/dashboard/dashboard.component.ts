import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ObjectHelper } from 'ts-common';
import { instanceToPlain, plainToInstance } from "class-transformer";
import { SessionService } from 'ng-altea-common';
import { Task } from 'ts-altea-model';

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
  
  task: Task


  constructor(protected sessionSvc: SessionService) {

  }


  ngOnInit() {



  }


  taskSelected(task: Task) {

    this.task = task

    console.error(task)

  }



}
