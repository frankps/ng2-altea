import { Component, ViewChild } from '@angular/core';
import { Contact, Order, PaymentType, SmsMessage, User } from 'ts-altea-model';
import { SearchContactComponent } from '../../contact/search-contact/search-contact.component';
import { AlteaService, BranchService, ObjectService, ProductService, ResourceService, ScheduleService, TemplateService, UserService } from 'ng-altea-common';
import { CheckDeposists, OrderMgmtService } from 'ts-altea-logic';
import { TranslationService } from 'ng-common'
import { Country } from 'ts-altea-model'
import { DbQuery, ObjectHelper, QueryOperator, Translation } from 'ts-common';
import { HttpClient } from '@angular/common/http';
import * as dateFns from 'date-fns'
import { MessagingService } from 'projects/ng-altea-common/src/lib/messaging.service';
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';

// Volgnummer;Uitvoeringsdatum;Valutadatum;Bedrag;Valuta rekening;Rekeningnummer;Type verrichting;Tegenpartij;Naam van de tegenpartij;
// Mededeling;Details;Status;Reden van weigering


@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {


  @ViewChild('searchContactModal') public searchContactModal: SearchContactComponent;

  country: Translation[] = []
  countries: Translation[] = []

  css_cls_row = 'mt-3'

  selectedContact?: Contact


  fileText: string;


  giftCode: string

  constructor(private http: HttpClient, public dbSvc: ObjectService, protected translationSvc: TranslationService, protected backEndSvc: ObjectService
    , protected userSvc: UserService, protected resourceSvc: ResourceService, protected anySvc: ScheduleService, protected productSvc: ProductService,
    protected messagingSvc: MessagingService, protected stripeSvc: StripeService) {

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


  async ngOnInit() {

    //   this.read()
    /* 
        await this.translationSvc.translateEnum(Country, 'enums.country.', this.countries)
        await this.translationSvc.translateEnum(Country, 'enums.country.', this.country)
    
        console.warn(this.country) */
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
