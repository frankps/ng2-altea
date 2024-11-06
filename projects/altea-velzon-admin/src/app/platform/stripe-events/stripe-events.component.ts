import { Component, ViewChild, OnInit, inject, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { deleteDoc, getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { plainToInstance } from 'class-transformer';
import { StripeEventContainer } from 'ts-altea-model';
//import { StripeService } from 'ng-altea-common';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';



@Component({
  selector: 'app-stripe-events',
  templateUrl: './stripe-events.component.html',
  styleUrls: ['./stripe-events.component.scss']
})
export class StripeEventsComponent implements OnInit, OnDestroy {
  private firestore: Firestore = inject(Firestore)

  stripeEventsSubscription: Subscription

  stripeEvents: StripeEventContainer[]

  selected: StripeEventContainer
  eventJson: string

  constructor(protected stripeSvc: StripeService) {

  }

  async ngOnInit(): Promise<void> {


    await this.getStripeEvents()

  }

  ngOnDestroy(): void {
    if (this.stripeEventsSubscription)
      this.stripeEventsSubscription.unsubscribe()
  }

  selectEvent(eventContainer: StripeEventContainer) {
    console.warn(eventContainer)
    this.selected = eventContainer
    this.eventJson = JSON.stringify(eventContainer.event, null, '\t')
  }

  postToWebhook(eventContainer: StripeEventContainer) {

    this.stripeSvc.webhookTest(eventContainer.event)

  }


  async getStripeEvents() {

    if (this.stripeEventsSubscription)
      this.stripeEventsSubscription.unsubscribe()

    const stripeEventsCol = collection(this.firestore, "operations", "stripe", "events")

    const qry = query(stripeEventsCol, orderBy('date', 'desc'), limit(10))

    this.stripeEventsSubscription = collectionData(qry).subscribe(dataSet => {

      this.stripeEvents = dataSet.map(data => {

        if (data['date'])
          data['date'] = data['date'].toDate()

        const event = plainToInstance(StripeEventContainer, data)

        return event
      })
      console.log(this.stripeEvents)


    })
  }



}
