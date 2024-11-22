import { Component, ViewChild, inject } from '@angular/core';
import { Contact, DateRangeTests, Message, Order, PaymentType, PriceCondition, PriceConditionType, Product, SmsMessage, User, ValueComparator } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { AlteaService, BranchService, ObjectService, OrderService, ProductService, ResourceService, ScheduleService, SessionService, TemplateService, UserService } from 'ng-altea-common';
import { AlteaDb, CheckDeposists, OrderCronJobs, OrderMessaging, OrderMgmtService } from 'ts-altea-logic';
import { TranslationService } from 'ng-common'
import { Country } from 'ts-altea-model'
import { DbQuery, ObjectHelper, QueryOperator, Translation } from 'ts-common';
import { HttpClient } from '@angular/common/http';
import * as dateFns from 'date-fns'
import { MessagingService } from 'projects/ng-altea-common/src/lib/messaging.service';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { deleteDoc, getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';

// Volgnummer;Uitvoeringsdatum;Valutadatum;Bedrag;Valuta rekening;Rekeningnummer;Type verrichting;Tegenpartij;Naam van de tegenpartij;
// Mededeling;Details;Status;Reden van weigering


@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {
  private firestore: Firestore = inject(Firestore)

  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;

  country: Translation[] = []
  countries: Translation[] = []

  css_cls_row = 'mt-3'

  selectedContact?: Contact


  fileText: string;


  giftCode: string

  cond: PriceCondition = new PriceCondition()

  priceConditionTypes: Translation[] = []
  valueComparators: Translation[] = []
  subscriptionUnitProducts: Product[] = []

  initialized = false

  constructor(private http: HttpClient, public dbSvc: ObjectService, protected translationSvc: TranslationService, protected backEndSvc: ObjectService
    , protected userSvc: UserService, protected resourceSvc: ResourceService, protected anySvc: ScheduleService, protected productSvc: ProductService, protected orderSvc: OrderService,
    protected messagingSvc: MessagingService, protected stripeSvc: StripeService, protected sessionSvc: SessionService) {

  }


  async ngOnInit() {

    await this.translationSvc.translateEnum(PriceConditionType, 'enums.price-condition-type.', this.priceConditionTypes)
    await this.translationSvc.translateEnum(ValueComparator, 'enums.value-comparator.', this.valueComparators)

    this.subscriptionUnitProducts = await this.productSvc.subscriptionUnitProducts()

    console.error(this.subscriptionUnitProducts)

    this.initialized = true
    //   this.read()
    /* 
        await this.translationSvc.translateEnum(Country, 'enums.country.', this.countries)
        await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    
        console.warn(this.country) */
  }



  stripeEvents: any[]

  loadStripeEvents() {

    //    operations/stripe/events

    const msgCol = collection(this.firestore, "operations", "stripe", "events")

    const qry = query(msgCol, orderBy('date', 'desc'), limit(10))  // , limit(10)

    collectionData(qry).subscribe(dataSet => {

      this.stripeEvents = dataSet //dataSet.map(data => plainToInstance(Message, data))
      //console.log(res)

      console.log(this.stripeEvents)

    })

    /*
            const container = {
            id: ObjectHelper.newGuid(),
            event: event,
            date: new Date()
        }
            */

  }


  async deleteOrder() {

    //let alteaDb = new AlteaDb(this.dbSvc)

    const orderMgmtSvc = new OrderMgmtService(this.dbSvc)


    var res = await orderMgmtSvc.deleteOrder('f9605132-2ca5-4132-b078-4fac5fa72d59')


    console.log(res)

  }

  dateRangeTest() {

    let tests = new DateRangeTests()

    // tests.test1()
    //tests.test2()

    tests.unionTests()


  }


  async demoOrder() {
    let id = 'f2b9132b-b1cb-4190-ba8a-69dff26116b5'

    let order = await this.orderSvc.get$(id)

    console.log(order)

    console.log(order.sumToString())
  }

  postToStripeWebhook(event: any) {


    var res = this.stripeSvc.webhookTest(event)

    console.log(res)
  }



  async cancelExpiredDeposits() {
    const orderMgmtSvc = new OrderMgmtService(this.dbSvc)

    console.warn('cancelExpiredDeposistOrders')

    orderMgmtSvc.cancelExpiredDeposistOrders()
  }


  async sendReminders() {

    let alteaDb = new AlteaDb(this.dbSvc)

    let msgSvc = new OrderMessaging(alteaDb)

    console.log('sendReminders')


    let res = await msgSvc.reminderMessaging2()

    console.log(res)


  }



  async orderCleanup() {

    console.warn('orderCleanup')

    const cron = new OrderCronJobs(this.dbSvc)

    await cron.cleanupOrders()


  }


  async orderPay() {

    const orderMgmtSvc = new OrderMgmtService(this.dbSvc)

    var res = await orderMgmtSvc.addPaymentToOrder('0100523b-0ca9-44f4-932f-ecfcbeb3a1aa', PaymentType.stripe, 50)

    console.warn(res)

    //var alteaSvc = new AlteaService(this)

    // var res = this.dbSvc

  }


  async stripeWebhook() {
    const order = new Order()

    var res = await this.stripeSvc.webhookTest(order)

    console.warn('stripeWebhook', res)
  }


  differenceInWeeks() {

    let d1 = new Date(2024, 3, 1)
    let d2 = new Date(2024, 3, 28)


    let dif = dateFns.differenceInWeeks(d2, d1)
    // => we are in the dif+1 week

    console.warn('Dif', dif)
  }


  async filterProducts() {

    console.error('filterProducts')

    // await this.productSvc.refreshCacheFromServer(this.productSvc.cacheQuery)

    let qry = new DbQuery()
    qry.and('catId', QueryOperator.equals, null)  // '83c7a2b4-83b8-49af-adbb-cc107649f0c2'

    let products = await this.productSvc.query$(qry)

    console.error(products)

  }

  async createUser() {

    let user = new User()

    user.prov = 'google'
    user.provEmail = "frank.paepens@davinci-it.be"
    user.email = 'frank@dvit.eu'

    let res = await this.userSvc.create$(user)

    console.error(res)
  }


  async sendSms() {

    const sms = new SmsMessage('Aquasense', '32478336034', `Dit bericht is een
herinnering aan uw reservatie bij Aquasense!

Datum: 1 april 2024 om 19h00
    `)

    const res = await this.messagingSvc.sendSms$(sms)

    console.error(res)
  }



  read() {

    this.http.get('\Macintosh HD/Users/frankpaepens/code/altea/interface files/fortis download.csv', { responseType: 'text' }).subscribe(data => {
      console.log(data);
    });

  }

  createGiftCode() {

    this.giftCode = ObjectHelper.createRandomString(6, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789")

  }

  readTextFile(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      this.fileText = reader.result as string;

      console.log(this.fileText)
    };

    reader.readAsText(file);
  }




  async saveMessage() {

    let msg = new Message()

    let res = await this.messagingSvc.saveMessage$(msg)

    console.log(res)

  }


  setContact(contact: Contact) {

    this.selectedContact = contact

  }


  searchWithModal() {

    this.searchContactModal.show()

  }


  cancelExpiredDeposists() {

    const checkDeposits = new CheckDeposists(this.dbSvc)

    // checkDeposits.cancelExpiredDeposists()


  }


  menuClicked(menuCode) {

    console.error(menuCode)

  }

  async refreshCaches() {
    await this.productSvc.loadFullCacheFromBackend()
  }


  async export() {
    let objects = await this.anySvc.export()
    console.warn(objects)

    const link = document.createElement("a");
    const content = JSON.stringify(objects, null, 3)
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "schedule.json";
    link.click();
    URL.revokeObjectURL(link.href);

  }

}
