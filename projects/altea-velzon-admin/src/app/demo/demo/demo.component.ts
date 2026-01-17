import { Component, ViewChild, inject } from '@angular/core';
import { Contact, DateRangeTests, Message, MsgType, Order, OrderLine, PaymentType, PriceCondition, PriceConditionType, Product, SmsMessage, Subscription, TemplateChannel, User, ValueComparator } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { AlteaService, BranchService, ObjectService, OrderService, ProductService, ResourceService, ScheduleService, SessionService, TemplateService, UserService } from 'ng-altea-common';
import { AlteaDb, CheckDeposists, ContactReactivation, CreateReportingData, OptOutContacts, OrderCronJobs, OrderMessaging, OrderMgmtService, ProductReporting, TaskSchedulingService } from 'ts-altea-logic';
import { TranslationService } from 'ng-common'
import { Country } from 'ts-altea-model'
import { DbQuery, DbQueryTyped, HtmlTable, ObjectHelper, QueryOperator, Translation } from 'ts-common';
import { HttpClient } from '@angular/common/http';
import * as dateFns from 'date-fns'
import { MessagingService } from 'projects/ng-altea-common/src/lib/messaging.service';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { deleteDoc, getDocs, limit, or, orderBy, query, where } from 'firebase/firestore';
import { Firestore, collection, collectionData, addDoc, CollectionReference, updateDoc, serverTimestamp, doc, docData, DocumentChange, DocumentData } from '@angular/fire/firestore';
import { NgxSpinnerService } from "ngx-spinner"
import * as _ from "lodash";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  input: string = `Email
eric.ysewyn@telenet.be
alma-tronconi@gmail.com
luypaertellen@gmail.com
lgermonpre@deloitte.com
masidelautaro@yahoo.com`

  constructor(private http: HttpClient, public dbSvc: ObjectService, protected translationSvc: TranslationService, protected backEndSvc: ObjectService
    , protected userSvc: UserService, protected resourceSvc: ResourceService, protected anySvc: ScheduleService, protected productSvc: ProductService, protected orderSvc: OrderService,
    protected messagingSvc: MessagingService, protected stripeSvc: StripeService, protected sessionSvc: SessionService,
    protected templateSvc: TemplateService, protected spinner: NgxSpinnerService, protected sanitizer: DomSanitizer) {

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


  async optOut(input: string) {

    console.error(input)

    if (!input)
      return

    let emails = input.split('\n').map(email => email.trim())

    let optOutContacts = new OptOutContacts(this.dbSvc)

    let contacts = await optOutContacts.optOut(emails)

    console.error(contacts)
  }

  async sleepingContacts() {

    let alteaDb = new AlteaDb(this.dbSvc)

    let contactReactivation = new ContactReactivation(alteaDb)  

    console.error('sleepingContacts')

    let res = await contactReactivation.reactivateContacts()
    console.log(res)


    /*
    let templates = await contactReactivation.getTemplates()
    console.log(templates)


    let res = await alteaDb.createTemplate(templates[0])

    //let res = await this.templateSvc.create$(templates[0])
    console.log(res)
    */


    /*
    console.error(templates)

    let alteaDb = new AlteaDb(this.dbSvc)

    let contacts = await alteaDb.getSleepingContacts(this.sessionSvc.branchId, 60)

    console.error(contacts)
    */
  }


  async aggregateReportData() {
    let alteaDb = new AlteaDb(this.dbSvc)
    let createReportingData = new CreateReportingData(alteaDb)

    /*      console.error('aggregateReportData')
        return  */


    await createReportingData.aggregateAll(this.sessionSvc.branchId, new Date(2024, 9, 1), new Date())
  }


  downloadCSV(csvString: string, filename: string = 'data.csv') {
    // Create a Blob from the CSV string
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    // Create a temporary link element
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async bodySculptorReporting() {
    let alteaDb = new AlteaDb(this.dbSvc)
    let productReporting = new ProductReporting(alteaDb)
    let report = await productReporting.bodySculptorReporting()

    let csvString = report.toCsv()
    console.error(csvString)

    this.downloadCSV(csvString, 'body-sculptor-report.csv')
  }

  /*
  Isabel <pieters.isabel@scarlet.be>; Mieke <mieke.beeckman@gmail.com>; Ilse <ilse.van.loo@hotmail.be>; Pascale <pascale.dhaenens@telenet.be>; Sonja <sonja.lauwers2@telenet.be>; Viviane <vivianedevalez@hotmail.com>; Linda <lindaknockaert6@gmail.com>; Kader <kader.capa@hotmail.com>; Annelie <annelie.bettens@gmail.com>; Elke <elkero@hotmail.com>; Nele <nele.van.vreckem@telenet.be>; els <elsenfree@hotmail.com>; Aurelie <aurelie.capiau@hotmail.com>; Jenny  <jenny.de.clercq@hotmail.com>; Carine <delmottecarine63@gmail.com>; Hilde <info@aquasense.be>; Nel <nel.vanherreweghe@gmail.com>; Nathalie <natje.decock@telenet.be>; Hilde <deswarte.hilde@gmail.com>; Karla <karla.colaes@gmail.com>; Elke <elke@signedelke.be>; Amine <emine.ekinci482@gmail.com>; Lies <lieslyppens@gmail.com>; Lina Maria  <lina.jooris@yahoo.com>; Marijke <Marijkemesselis@icloud.com>; Linda <linda.deschoenmacker@gmail.com>; Inge <martens_inge@hotmail.com>; Soumia  <soumia.ouali@telenet.be>; Saskia <saskia.baetens@telenet.be>
*/

  async queryBodySculptorCustomers() {

    let alteaDb = new AlteaDb(this.dbSvc)

    console.error('queryBodySculptorCustomers')



    let subsQry = new DbQueryTyped<OrderLine>('orderLine', OrderLine)
    subsQry.include('order.contact')
    subsQry.and('productId', QueryOperator.equals, '3a52a26d-6cf7-4f56-bfcc-049d44fd9402')  // '83c7a2b4-83b8-49af-adbb-cc107649f0c2'
    // subsQry.and('order.start', QueryOperator.greaterThan, 20250829000000)

    console.error(subsQry)

    let orderLines = await this.dbSvc.query$<OrderLine>(subsQry)

    let contacts = orderLines.map(l => {
      let contact = l.order?.contact

      if (!contact) return null

      //return `${contact.first} <${contact.email}>`

      return `${contact.email};${contact.first};${contact.last};V`
    }).filter(c => c != null)

    contacts = _.uniq(contacts)

    // let contactList = contacts.join('; ')

    contacts.splice(0, 0, 'Email;Naam;Achternaam;Geslacht')

    let contactList = contacts.join('\n')

    console.error(contacts)
    console.error(contactList)
  }



  async prepareProductTasks() {
    let alteaDb = new AlteaDb(this.dbSvc)

    let taskSvc = new TaskSchedulingService(alteaDb)

    let res = await taskSvc.instantiateProductRelatedTasks()

    console.error(res)

  }

  async createReports() {

    let alteaDb = new AlteaDb(this.dbSvc)

    let createReportingData = new CreateReportingData(alteaDb)

    let branchId = this.sessionSvc.branchId

    let startDate = new Date(2025, 3, 1)
    let endDate = new Date()

    /*
    const days : Date[] = dateFns.eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    days.forEach(async day => {

      let res = await createReportingData.createForDay(branchId, day.getFullYear(), day.getMonth() + 1, day.getDate())

      console.error(res)

    })
    */

    this.spinner.show()

    let res = await createReportingData.createForDays(branchId, startDate, endDate)

    console.error(res)

    this.spinner.hide()


    //  let res = await createReportingData.createForDay(branchId, 2025, 5, 29)

    //  console.error(res)

  }


  async doorOpenedWhatsapp() {

    let alteaDb = new AlteaDb(this.dbSvc)

    let msgSvc = new OrderMessaging(alteaDb)

    let branch = await this.sessionSvc.branch$()

    let template = await alteaDb.getTemplate(this.sessionSvc.branchId, 'door_opened2', MsgType.wa)
    console.warn(template)

    let order = await alteaDb.getOrder('c954ce18-0998-4fdf-b774-00d9625e3896', 'contact')
    console.warn(order)

    const msg = template.mergeWithOrder(order, branch, true)

    msg.type = MsgType.wa
    msg.orderId = order?.id

    msg.addTo('+32478336034', 'Frank Paepens')
    console.warn(msg)

    const sendRes = await alteaDb.db.sendMessage$(msg)
    //const sendRes = new ApiResult(msg)

    console.warn(sendRes)



    // await msgSvc.sendWhatsAppMessage(template, order, branch, false)

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

  customReport: SafeHtml

  async getSubscriptions() {

    let me = this

    let alteaDb = new AlteaDb(this.dbSvc)

    //let res = await alteaDb.getSu

    let subsQry = new DbQueryTyped<Subscription>('subscription', Subscription)
    //subsQry.take = 5
    subsQry.include('contact')
    subsQry.and('subscriptionProductId', QueryOperator.equals, '3a52a26d-6cf7-4f56-bfcc-049d44fd9402')  // '83c7a2b4-83b8-49af-adbb-cc107649f0c2'
    // qry.and('usedQty', QueryOperator.lessThan, 'totalQty')

    let subs = await this.dbSvc.query$<Subscription>(subsQry)

    let contactIds = subs.map(sub => sub.contactId)
    contactIds = _.uniq(contactIds)

    let ordersQry = new DbQueryTyped<Order>('order', Order)
    ordersQry.include('lines.product')
    ordersQry.and('contactId', QueryOperator.in, contactIds)
    ordersQry.and('start', QueryOperator.greaterThan, 20250829000000)
    ordersQry.orderBy('start')
    ordersQry.take = 1000

    let orders = await this.dbSvc.query$<Order>(ordersQry)

    console.error(subs)
    console.error(orders)



    let table = new HtmlTable()

    table.headerRow = true

    table.styles.th = "padding-right:100px"
    let header: string[] = []
    table.addRow(header)

    header.push('Klant', 'Mobile', 'Email', 'Subscription', 'Open/Total')


    for (let sub of subs) {
      table.addRow([sub.contact?.name, sub.contact?.mobile, sub.contact?.email, sub.name, `${sub.openQty()}/${sub.totalQty}`])

      let contactOrders = orders.filter(o => o.contactId === sub.contactId)

      for (let order of contactOrders) {
        table.addRow(['', order.startDateFormat(), order.lines.map(l => l.product.name).join(', ')])
      }



    }

    let htmlString = table.toHtmlString()
    console.error(table.toHtmlString())
    me.customReport = this.sanitizer.bypassSecurityTrustHtml(htmlString)


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
