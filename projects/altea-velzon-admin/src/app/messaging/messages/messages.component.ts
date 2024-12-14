import { Component, ViewChild, OnInit, inject, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { deleteDoc, getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import { SessionService } from 'ng-altea-common';
import { Message, MessageAddress, MsgDirColor, MsgDirIcon, MsgStateIcon, MsgType, MsgTypeIcon, TemplateFormat, WhatsAppMessage, WhatsAppProviderInfo } from 'ts-altea-model';
import { MessagingService } from 'projects/ng-altea-common/src/lib/messaging.service';
import { plainToInstance } from 'class-transformer';
import { Editor, toHTML } from 'ngx-editor'

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  private firestore: Firestore = inject(Firestore)
  //  messages$: Observable<any[]>
  messages: Message[]

  msgId?: string

  /** text for new message or reply */
  body: string

  MsgType = MsgType

  MsgDirIcon = MsgDirIcon
  MsgDirColor = MsgDirColor
  MsgTypeIcon = MsgTypeIcon
  MsgStateIcon = MsgStateIcon

  // html editor 
  editor: Editor;

  htmlInit = `<br><br>`   // needed for ngx-editor: otherwise enters do not work!!

  html: string = this.htmlInit

  filters = {
    direction: {
      out: false,
      in: true
    },
    type: {
      email: false,
      wa: true   // Whatsapp
    }

  }



  editorChange(event: any) {
    console.error(event)
    console.error(this.html)

    /*
    this.body = toHTML(event.content);
    console.log(this.body);
    */
  }

  constructor(protected sessionSvc: SessionService, protected msgSvc: MessagingService) {

  }

  filterColor(property: string, value: string) {

    if (this.filters[property][value])
      return 'btn-primary'
    else
      return 'btn-light'


  }

  async ngOnInit(): Promise<void> {

    this.editor = new Editor()

    await this.getMessages()

  }

  ngOnDestroy(): void {
    this.editor.destroy()
    
    if (this.messageSubscription)
      this.messageSubscription.unsubscribe()
  }

  messageSubscription: Subscription

  async getMessages() {

    if (this.messageSubscription)
      this.messageSubscription.unsubscribe()

    const msgCol = collection(this.firestore, "branches", this.sessionSvc.branchId, "msg")

    const directions = []
    if (this.filters.direction.in) directions.push('in')
    if (this.filters.direction.out) directions.push('out')

    const directionFilter = where('dir', 'in', directions)

    const types = []
    if (this.filters.type.email) types.push('email')
    if (this.filters.type.wa) types.push('wa')

    const typeFilter = where('type', 'in', types)

    const AND = [directionFilter, typeFilter]  // 

    const qry = query(msgCol, ...AND, orderBy('sent', 'desc'), limit(20))  // 

    this.messageSubscription = collectionData(qry).subscribe(dataSet => {

      this.messages = dataSet.map(data => plainToInstance(Message, data))
      console.log(this.messages)


    })
  }

  debug(msg: Message) {

    let providerId = msg.prov.id

    console.log(providerId)

    const msgCol = collection(this.firestore, "operations", "msg", "in")

    const filter = where('msg.entry[0].id', '==', providerId)

    const qry = query(msgCol, filter)

    let sub = collectionData(qry).subscribe(dataSet => {

      console.log(dataSet)

      sub.unsubscribe()
    })


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

  async delete(msg: Message) {
    console.error(msg)

    const res = await deleteDoc(doc(this.firestore, "branches", this.sessionSvc.branchId, "msg", msg.id));
  }

  sendReply(origMsg: Message, body: string) {

    console.log(this.html)



    if (!origMsg)
      return



    const reply: Message = origMsg.createReply()

    reply.from = new MessageAddress(this.sessionSvc.branch.emailFrom)

    if (origMsg.type == MsgType.email) {
      reply.body = this.html
      reply.fmt = TemplateFormat.html
    }
    else
      reply.body = this.body

    if (this.sessionSvc.humanResource)
      reply.resId = this.sessionSvc.humanResource.id

    console.log(reply)

    const res = this.msgSvc.sendMessage$(reply)

    this.msgId = undefined
    this.body = ''
    this.html = this.htmlInit


    /*
    let providerInfo = origMsg.prov as WhatsAppProviderInfo

    const whatsapp = new WhatsAppMessage(origMsg.from.addr, this.body, providerInfo.phoneId, providerInfo.id)

    const res = this.msgSvc.sendWhatsApp$(whatsapp)

    console.log(res)
  */

  }


}
