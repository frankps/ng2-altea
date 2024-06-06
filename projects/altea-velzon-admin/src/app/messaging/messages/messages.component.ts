import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import { SessionService } from 'ng-altea-common';
import { Message, WhatsAppMessage, WhatsAppProviderInfo } from 'ts-altea-model';
import { MessagingService } from 'projects/ng-altea-common/src/lib/messaging.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {
  private firestore: Firestore = inject(Firestore)
  messages$: Observable<any[]>

  msgId?: string

  /** text for new message or reply */
  body: string

  constructor(protected sessionSvc: SessionService, protected msgSvc: MessagingService) {

  }

  async ngOnInit(): Promise<void> {

    await this.getMessages()

  }

  getMessages() {
    const aCollection = collection(this.firestore, "branches", this.sessionSvc.branchId, "msg")
    this.messages$ = collectionData(aCollection);
  }

  toggle(msg: Message) {

    if (!msg)
      return

    console.log(msg)

    if (msg.id == this.msgId)
      this.msgId = undefined
    else
      this.msgId = msg.id

  }

  sendReply(msg: Message, body) {

    if (!msg)
      return

    let providerInfo = msg.prov as WhatsAppProviderInfo

    const whatsapp = new WhatsAppMessage(msg.from.addr, this.body, providerInfo.phoneId, providerInfo.id)


    const res = this.msgSvc.sendWhatsApp$(whatsapp)

    console.log(res)

  }

  /*
    async getMessagesOld() {
      const msgCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "msg");
  
      const qry = query(msgCol, orderBy('cre', 'desc'), limit(10))
  
      const querySnapshot = await getDocs(qry);
  
      querySnapshot.forEach((doc) => {
        
        console.log(doc.id, " => ", doc.data());
      });
    }
  */

}
