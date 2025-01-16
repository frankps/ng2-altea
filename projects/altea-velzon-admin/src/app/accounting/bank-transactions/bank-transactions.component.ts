import { Component, OnInit } from '@angular/core';
import { BankTransactionService, ObjectService, PaymentService } from 'ng-altea-common';
import { ApiListResult, ApiStatus, ArrayHelper, DateHelper, DbQuery, ObjectHelper, QueryOperator, Translation } from 'ts-common';
import * as dateFns from 'date-fns'
import { BankTransaction, BankTxType, Payment, Payments, PaymentType, StripeGetPayouts, StripePayout } from 'ts-altea-model';
import { AlteaDb, BankTransactionLinking, FortisBankImport } from 'ts-altea-logic';
import * as _ from "lodash";
import { StripeService } from 'projects/ng-altea-common/src/lib/stripe.service';
import { DashboardService, ToastType, TranslationService } from 'ng-common'

@Component({
  selector: 'app-bank-transactions',
  templateUrl: './bank-transactions.component.html',
  styleUrls: ['./bank-transactions.component.scss']
})
export class BankTransactionsComponent implements OnInit {



  bank = {
    from: new Date(),
    to: new Date(),
    search: null,
    types: [],
    notLinked: true,
    linked: false,
    positive: true,
    negative: false
  }

  /*
  from: Date = new Date()
  to: Date = dateFns.addMonths(this.from, -2)
*/

  showUpload: false

  txs: BankTransaction[]

  /** transaction currently in focus */
  focusTx: BankTransaction

  /** id of bank transaction that is currently in focus */
  txId?: string

  /** payments for current transaction */
  pays: Payment[]

  /** current payment in edit */
  payInEdit: Payment

  /** used in case of cancel edit */
  payClone: Payment

  selectedPays = {}

  payments = {
    total: 0,
    linked: 0,
    missing: 0,  // total - selected
    selected: 0,

  }

  alteaDb: AlteaDb

  bankTransactionLinking: BankTransactionLinking

  stripe = {
    payouts: null
  }

  payouts: null

  bankTxTypes: Translation[] = []
  paymentTypes: Translation[] = []

  init = false

  constructor(protected txSvc: BankTransactionService, protected paySvc: PaymentService, protected objSvc: ObjectService,
    protected stripeSvc: StripeService, protected objectSvc: ObjectService, private translationSvc: TranslationService, public dashboardSvc: DashboardService) {

  }

  async ngOnInit() {

    this.alteaDb = new AlteaDb(this.objectSvc)
    this.bankTransactionLinking = new BankTransactionLinking(this.alteaDb)

    this.initFilters()
    await this.getTransactions()

    await this.translationSvc.translateEnum(BankTxType, 'enums.bank-tx-type.', this.bankTxTypes)
    await this.translationSvc.translateEnum(PaymentType, 'enums.pay-type.', this.paymentTypes)

    this.init = true

  }

  toggleEditPayment(payment: Payment) {

    console.log(payment)
    if (payment.id != this.payInEdit?.id) {
      this.payInEdit = ObjectHelper.clone(payment, Payment)
    }
    else
      this.payInEdit = null

  }

  cancelPayment(idx: number) {

    this.pays[idx] = this.payInEdit
    this.payInEdit = null
  }

  async savePayment(payment: Payment) {

    if (!payment)
      return

    let update = {
      id: payment.id,
      type: payment.type,
      amount: payment.amount,
      date: payment.date
    }

    let updateRes = await this.paySvc.update$(update)
    console.log(updateRes)

    if (updateRes.isOk) {
      this.payInEdit = null
      this.dashboardSvc.showToastType(ToastType.saveSuccess)
    } else
      this.dashboardSvc.showToastType(ToastType.saveError)


  }

  getSelectedOrUnselectedPaymentIds(selectedOnly = false): string[] {

    let me = this

    let paymentIds = []

    Object.keys(me.selectedPays).forEach(paymentId => {

      const selected = this.selectedPays[paymentId]

      if (!selectedOnly || selected)
        paymentIds.push(paymentId)

      /*
      

      if (selected)
        */

    })

    return paymentIds
  }

  getSelectedOrUnselectedPayments(selectedOnly = false): Payment[] {
    let paymentIds = this.getSelectedOrUnselectedPaymentIds(selectedOnly)

    let payments = this.pays.filter(pay => paymentIds.indexOf(pay.id) >= 0)

    return payments
  }

  showTotalSelected() {
    const payments = this.getSelectedOrUnselectedPayments(true)
    this.payments.selected = _.round(_.sumBy(payments, 'amount'), 2)

    if (this.focusTx)
      this.payments.missing = _.round(this.focusTx.amountToLink() - this.payments.selected, 2)
    else
      this.payments.missing = 0
  }


  togglePayment(pay: Payment) {

    this.showTotalSelected()
  }


  async invalidateTransactions(transactionIdsToInvalidate: string[]): Promise<ApiListResult<BankTransaction>> {

    if (ArrayHelper.IsEmpty(transactionIdsToInvalidate))
      return ApiListResult.warning('No transactions to update')

    let updates = []

    for (let txId of transactionIdsToInvalidate) {

      let update = {
        id: txId,
        ok: false
      }

      updates.push(update)
    }

    var txUpdate = await this.alteaDb.updatePartialObjects('bankTransaction', BankTransaction, updates)
    console.log('invalidate other transactions', txUpdate)

    if (txUpdate.status == ApiStatus.ok) {

      // also update the local transactions
      for (let txId of transactionIdsToInvalidate) {
        let tx = this.txs.find(tx => tx.id == txId)

        if (tx)
          tx.ok = false
      }
    }

    return txUpdate


  }



  async linkSelectedPayments(linkWith: BankTransaction) {
    let me = this

    const paymentsToProcess = this.getSelectedOrUnselectedPayments()

    const selectedPayments = this.getSelectedOrUnselectedPayments(true)

    if (ArrayHelper.IsEmpty(paymentsToProcess))
      return

    let totalAmount = 0

    let updatedPayments = []

    let transactionIdsToInvalidate = []

    for (let pay of paymentsToProcess) {

      let selected = me.selectedPays[pay.id]

      if (selected) {
        totalAmount += _.round(pay.amount, 2)

        if (pay.bankTxId == linkWith.id && pay.lnk) // already selected
          continue

        if (pay.bankTxId && pay.bankTxId != linkWith.id) {  // linked to other transaction

          if (transactionIdsToInvalidate.indexOf(pay.bankTxId) == -1)
            transactionIdsToInvalidate.push(pay.bankTxId)

        }

        if (pay.bankTxId != linkWith.id || pay.bankTxNum != linkWith.num) {
          pay.bankTxId = linkWith.id
          pay.bankTxNum = linkWith.num
          //pay.lnk = true
          updatedPayments.push(pay)
        }
      } else {  // !selected

        // we will only save if it was unselected and previously this transaction
        if (pay.bankTxId == linkWith.id) {

          pay.bankTxId = null
          pay.bankTxNum = null
          pay.lnk = false
          updatedPayments.push(pay)

          if (transactionIdsToInvalidate.indexOf(pay.bankTxId) == -1)
            transactionIdsToInvalidate.push(pay.bankTxId)
        }

      }

    }

    let bankTxAmount = _.round(linkWith.amount, 2)

    if (linkWith.type == BankTxType.terminalCredit)
      bankTxAmount = linkWith.orig  // = amount - cost 

    totalAmount = _.round(totalAmount, 2)
    let allLinksOk = (totalAmount == bankTxAmount)

    for (let pay of selectedPayments) {
      if (pay.lnk != allLinksOk) {
        pay.lnk = allLinksOk

        if (updatedPayments.indexOf(p => p.id == pay.id) == -1)
          updatedPayments.push(pay)
      }
    }


    if (ArrayHelper.NotEmpty(updatedPayments)) {
      console.log(`${updatedPayments.length} payments to update`)
      let updatePaysRes = await this.alteaDb.updatePayments(updatedPayments, ['bankTxId', 'bankTxNum', 'lnk'])
      console.log(updatePaysRes)

    }


    if (allLinksOk != linkWith.ok) {

      linkWith.ok = allLinksOk
      var txUpdate = await this.alteaDb.updateBankTransaction(linkWith, ['ok'])
      console.log(txUpdate)

    }

    if (ArrayHelper.NotEmpty(transactionIdsToInvalidate))
      await me.invalidateTransactions(transactionIdsToInvalidate)

  }


  initFilters() {

    this.bank.from = new Date(2024, 9, 1)
    this.bank.to = new Date(2024, 11, 31)

    //this.bank.from = dateFns.addMonths(this.bank.to, -2)

  }

  // specifies which payments are pre-selected for a transaction
  selectionMode: 'none' | 'auto' | 'linked' | 'not-linked' | 'all' = 'none'

  toggleTx(tx: BankTransaction) {

    console.log(tx)
    tx['open'] = !tx['open']

    if (tx['open']) {

      this.selectionMode = 'none'
      this.findPaymentsForTx(tx)

      /* if (!tx.ok)
        this.findPaymentsForTx(tx)
 */
    } else {
      this.focusTx = null
    }

  }

  /*
  "OVERSCHRIJVING IN EURO VAN REKENING NL41CITI2032304805 BIC CITINL2X STRIPE CO A L GOODBODY IFSC NORTH WALL QUA REFERTE OPDRACHTGEVER 
  : STRIPE-RQWZXXC1XUK33U12XCL2OQL5KLUW MEDEDELING : STRIPE BANKREFERENTIE : 2410141145430438 VALUTADATUM : 14/10/2024"

  OVERSCHRIJVING IN EURO VAN REKENING NL41CITI2032304805 BIC CITINL2X STRIPE CO A L GOODBODY IFSC NORTH WALL QUA REFERTE OPDRACHTGEVER : 
  STRIPE-T2HDWXVJQFOPOAFXQLBUPVMW9XNL MEDEDELING : STRIPE BANKREFERENTIE : 2410151017415860 VALUTADATUM : 15/10/2024
  */

  async getTransactions() {

    const qry = new DbQuery()

    const fromNum = DateHelper.yyyyMMdd(this.bank.from)
    const toNum = DateHelper.yyyyMMdd(this.bank.to)

    qry.and('execDate', QueryOperator.greaterThanOrEqual, fromNum)
    qry.and('execDate', QueryOperator.lessThanOrEqual, toNum)

    // qry.and('ok', QueryOperator.equals, false)

    if (this.bank.search)
      qry.and('details', QueryOperator.contains, this.bank.search)

    if (ArrayHelper.NotEmpty(this.bank.types)) {
      // console.log(this.bank.types)
      qry.and('type', QueryOperator.in, this.bank.types)
    }

    if (this.bank.notLinked != this.bank.linked) {
      if (this.bank.notLinked)
        qry.and('ok', QueryOperator.equals, false)

      if (this.bank.linked)
        qry.and('ok', QueryOperator.equals, true)

    }

    if (this.bank.positive)
      qry.and('amount', QueryOperator.greaterThanOrEqual, 0)

    if (this.bank.negative)
      qry.and('amount', QueryOperator.lessThanOrEqual, 0)

    qry.orderByDesc('num')

    qry.take = 300
    qry.include('payments.order')

    console.warn(qry)

    this.txs = await this.txSvc.query$(qry)

    console.warn(this.txs)

  }


  async searchPayments(fromDate: Date, toDate: Date, txType: BankTxType): Promise<Payments> {
    let me = this

    const qry = new DbQuery()

    qry.include('order')

    let or1 = qry

    or1.and('date', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(fromDate))
    or1.and('date', QueryOperator.lessThanOrEqual, DateHelper.yyyyMMddhhmmss(toDate))

    let payTypes = [PaymentType.credit, PaymentType.debit, PaymentType.transfer]

    if (txType == BankTxType.stripe) {
      payTypes = [PaymentType.stripe]
    }

    or1.and('type', QueryOperator.in, payTypes)

    qry.take = 50

    let payments = await me.paySvc.query$(qry)

    return new Payments(payments)
  }


  async findPaymentsForTx(tx: BankTransaction, extraDays: number = 0) {

    let me = this

    console.log(`findPaymentsForTx`, tx)

    this.txId = tx.id
    this.focusTx = tx
    this.pays = []

    const fortis = new FortisBankImport(this.objSvc)

    const txInfo = fortis.getBankTransactionInfo(tx)

    let searchPays = new Payments()


    const forDate = txInfo.forDateTime()
    let fromDate = dateFns.startOfDay(forDate)

    if (forDate) {

      let toDate = dateFns.endOfDay(forDate)

      if (extraDays > 0) {
        fromDate = dateFns.addDays(fromDate, - extraDays)
        toDate = dateFns.addDays(toDate, extraDays)
      }

      console.warn(txInfo)

      searchPays = await this.searchPayments(fromDate, toDate, tx.type)
    }


    me.pays = searchPays.add(...tx.payments).orderByDate()

    me.selectedPays = {}

    let paysAlreadyLinked = []

    if (tx.ok && ArrayHelper.NotEmpty(me.pays)) {

      paysAlreadyLinked = me.pays.filter(pay => pay.bankTxId == tx.id)

      if (ArrayHelper.NotEmpty(paysAlreadyLinked)) {
        for (let pay of paysAlreadyLinked)
          me.selectedPays[pay.id] = true
      }

    }


    this.showTotals(me.pays, tx)

    if (!tx.ok || me.payments.linked == 0) {
      let matchingPayments = me.tryToFindMatchingPayments(tx, me.pays)

      if (ArrayHelper.IsEmpty(matchingPayments)) { // if no exact set of payments found
        this.magicSelection()

        if (fromDate)
          await this.findMissingPaysInDb(tx, fromDate, [me.payments.missing, tx.amount])
      }

    }

    console.warn(this.pays)
  }

  addLabel(pays: Payment[], label: string) {

    if (ArrayHelper.IsEmpty(pays))
      return

    for (let pay of pays) {

      if (!pay['labels'])
        pay['labels'] = []

      pay['labels'].push(label)

    }

  }

  async findMissingPaysInDb(tx: BankTransaction, refDate: Date, missing: number[]): Promise<Payment[]> {
    let me = this

    let candidates = await me.getMissingPaysFromDb(refDate, missing)

    if (ArrayHelper.NotEmpty(candidates)) {

      this.addLabel(candidates, 'xtr')
      me.pays.push(...candidates)
      me.pays = _.orderBy(me.pays, ['date'], ['desc'])

      // we try again with the extra retrieved payments
      let matchingPayments = me.tryToFindMatchingPayments(tx, me.pays)
      return matchingPayments
    }

    return []
  }

  async getMissingPaysFromDb(refDate: Date, missing: number[]): Promise<Payment[]> {
    let me = this

    let fromDate = dateFns.subDays(refDate, 15)
    let toDate = dateFns.addDays(refDate, 15)

    const qry = new DbQuery()
    qry.include('order')
    qry.and('date', QueryOperator.greaterThanOrEqual, DateHelper.yyyyMMddhhmmss(fromDate))
    qry.and('date', QueryOperator.lessThanOrEqual, DateHelper.yyyyMMddhhmmss(toDate))
    qry.and('amount', QueryOperator.in, missing)

    let sameAmountPays = await me.paySvc.query$(qry)

    return sameAmountPays
  }


  tryToFindMatchingPayments(tx: BankTransaction, pays: Payment[]): Payment[] {

    let bankTxAmount = tx.amountToLink()

    let totalAmountAllPays = _.round(_.sumBy(pays, 'amount'), 2)

    let paysNotLinked = pays.filter(p => !p.bankTxId)
    let totalAmountPaysNotLinked = 0

    if (ArrayHelper.NotEmpty(paysNotLinked))
      totalAmountPaysNotLinked = _.round(_.sumBy(paysNotLinked, 'amount'), 2)

    if (totalAmountAllPays == bankTxAmount) {  // then we can pre-select all payments (ready for linking)
      this.selectPayments(pays)
      return pays
    } else if (totalAmountPaysNotLinked == bankTxAmount) {
      this.selectPayments(paysNotLinked)
      return paysNotLinked
    } else if (bankTxAmount < totalAmountAllPays) {  // we have too many payments

      let diff = _.round(totalAmountAllPays - bankTxAmount, 2)

      // let's try to find a single payment that should be excluded
      let diffPayIdx = pays.findIndex(p => _.round(p.amount, 2) == diff)

      if (diffPayIdx >= 0) {
        return this.selectPaymentsAfterRemove(pays, diffPayIdx)
      }

      // let's try to find a single payment that equals amount to match
      let matchPayIdx = pays.findIndex(p => _.round(p.amount, 2) == bankTxAmount)

      if (matchPayIdx >= 0) {
        return this.selectPaymentsOnIndexes(pays, matchPayIdx)
      }


      // let's try to find a combination of 2 payments that or math the difference or the amount

      let nrOfPays = pays.length

      for (let payIdx1 = 0; payIdx1 < nrOfPays; payIdx1++) {
        for (let payIdx2 = payIdx1 + 1; payIdx2 < nrOfPays; payIdx2++) {

          let pay1 = pays[payIdx1]
          let pay2 = pays[payIdx2]

          let sum2 = _.round(pay1.amount + pay2.amount, 2)

          if (sum2 == diff)
            return this.selectPaymentsAfterRemove(pays, payIdx2, payIdx1)
          else if (sum2 == bankTxAmount)
            return this.selectPaymentsOnIndexes(pays, payIdx2, payIdx1)


          for (let payIdx3 = payIdx2 + 1; payIdx3 < nrOfPays; payIdx3++) {
            let pay3 = pays[payIdx3]
            let sum3 = _.round(sum2 + pay3.amount, 2)

            if (sum3 == diff)
              return this.selectPaymentsAfterRemove(pays, payIdx3, payIdx2, payIdx1)
            else if (sum3 == bankTxAmount)
              return this.selectPaymentsOnIndexes(pays, payIdx3, payIdx2, payIdx1)



            for (let payIdx4 = payIdx3 + 1; payIdx4 < nrOfPays; payIdx4++) {
              let pay4 = pays[payIdx4]
              let sum4 = _.round(sum3 + pay4.amount, 2)

              if (sum4 == diff)
                return this.selectPaymentsAfterRemove(pays, payIdx4, payIdx3, payIdx2, payIdx1)
              else if (sum4 == bankTxAmount)
                return this.selectPaymentsOnIndexes(pays, payIdx4, payIdx3, payIdx2, payIdx1)
            }


          }

        }
      }





    }

    return []

  }

  selectPaymentsAfterRemove(payments: Payment[], ...indexesToRemove: number[]): Payment[] {
    let paysToSelect = [...payments]

    for (let idx of indexesToRemove) {
      paysToSelect.splice(idx, 1)
    }

    this.selectPayments(paysToSelect)
    return paysToSelect
  }

  selectPaymentsOnIndexes(payments: Payment[], ...indexes: number[]): Payment[] {
    let paysToSelect = []

    for (let idx of indexes) {
      paysToSelect.push(payments[idx])
    }

    this.selectPayments(paysToSelect)
    return paysToSelect
  }


  selectPayments(payments: Payment[], selectionMode: 'auto' = 'auto') {

    if (ArrayHelper.NotEmpty(payments)) {
      for (let pay of payments)
        this.selectedPays[pay.id] = true

      this.selectionMode = selectionMode
    }


    this.showTotalSelected()
  }

  magicSelection() {

    this.selectedPays = {}

    let selected = 0

    if (ArrayHelper.IsEmpty(this.pays)) {
      return
    }


    let paysForThisTx = this.pays.filter(p => p.bankTxId = this.txId)

    for (let pay of paysForThisTx)
      this.selectedPays[pay.id] = false

    if (this.selectionMode != 'not-linked') {
      for (let pay of this.pays) {
        if (!pay.bankTxId || pay.bankTxId == this.txId) {
          this.selectedPays[pay.id] = true
          selected++
        }
      }
      this.selectionMode = 'not-linked'
    } else {
      this.selectionMode = 'none'
    }



    this.showTotalSelected()

  }

  showTotals(pays: Payment[], tx: BankTransaction) {

    this.payments.total = 0
    this.payments.linked = 0
    this.payments.selected = 0

    if (ArrayHelper.IsEmpty(pays))
      return

    this.payments.total = _.round(_.sumBy(pays, 'amount'), 2)

    if (tx?.id) {
      let paysForTx = pays.filter(p => p.bankTxId == tx.id)
      this.payments.linked = _.round(_.sumBy(paysForTx, 'amount'), 2)
    }

    this.showTotalSelected()
  }


  async autoStripe(): Promise<any> {

    let me = this
    // get latest payout id

    let lastKnownPayout = await me.alteaDb.getLatestBankTransaction(true)

    console.error(lastKnownPayout)
    let filter = new StripeGetPayouts()
    filter.endingBefore = lastKnownPayout.providerRef

    let payouts: StripePayout[] = await me.stripeSvc.getPayouts$(filter)

    me.stripe.payouts = payouts

    if (ArrayHelper.IsEmpty(payouts)) {
      let msg = `No new payouts`
      console.log(msg)
      return msg
    }


    let dates = payouts.map(po => po.date)

    let minDate = dateFns.subDays(_.min(dates), 2)
    let maxDate = dateFns.addDays(_.max(dates), 2)

    me.txs = await me.alteaDb.getBankTransactionsBetween(minDate, maxDate, [BankTxType.stripe], { ok: false })

    if (ArrayHelper.IsEmpty(me.txs)) {
      let msg = `No new transactions`
      console.log(msg)
      return msg
    }


    console.error(me.txs)
    //return

    let newlyLinkedTransactions = await me.bankTransactionLinking.assignStripePayoutsToTransactions(me.stripe.payouts, me.txs)

    if (ArrayHelper.IsEmpty(newlyLinkedTransactions)) {
      let msg = `No new Stripe transactions to process`
      console.log(msg)
      return msg
    }



    /*       let payments = await this.alteaDb.getPaymentsBetween(minDate, maxDate, [PaymentType.stripe])
          console.log(payments) */


    for (let tx of newlyLinkedTransactions) {

      await me.getStripePayout(tx)

      if (!tx.prov)
        continue

      await me.bankTransactionLinking.linkStripe(tx)


    }








    console.error(`${minDate} - ${maxDate}`)

    console.error(this.stripe.payouts)

  }



  async getStripePayouts(endingBeforePayoutId: string, assignStripePayoutsToTransactions = true) {

    let filter = new StripeGetPayouts()
    filter.endingBefore = endingBeforePayoutId

    this.stripe.payouts = await this.stripeSvc.getPayouts$(filter)

    if (assignStripePayoutsToTransactions)
      this.bankTransactionLinking.assignStripePayoutsToTransactions(this.stripe.payouts, this.txs)

    console.error(this.stripe.payouts)
  }


  async getStripePayout(tx: BankTransaction) {

    let me = this

    let payout = await me.stripeSvc.getPayout$(tx.providerRef)

    tx.prov = payout

    let update = {
      id: tx.id,
      prov: payout
    }

    console.error(payout)

    let res = await this.txSvc.update$(update)

    console.error(res)

  }


  async linkStripe(tx: BankTransaction) {

    //let stripeTransactions = tx?.prov?.transactions



    await this.bankTransactionLinking.linkStripe(tx)

  }

  async fallBackStripeLinking(tx: BankTransaction) {

    //let stripeTransactions = tx?.prov?.transactions



    await this.bankTransactionLinking.fallBackStripeLinking(tx)

  }





}


