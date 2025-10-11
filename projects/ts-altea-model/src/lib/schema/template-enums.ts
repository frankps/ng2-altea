
import 'reflect-metadata'

export enum TemplateType {
  general = 'general',
  confirmation = 'confirmation',
  cancel = 'cancel',
  cancelClient = 'cancelClient',
  cancelProvider = 'cancelProvider',
  change = 'change',
  reminder = 'reminder',
  waitDeposit = 'waitDeposit',

}

export enum TemplateCode {

  resv_wait_deposito = 'resv_wait_deposito',   // had to add 'o', because trouble with WhatsApp
  resv_remind_deposit = 'resv_remind_deposit',
  resv_confirmation = 'resv_confirmation',
  resv_no_deposit_cancel = 'resv_no_deposit_cancel',
  resv_in_time_cancel = 'resv_in_time_cancel',
  resv_late_cancel = 'resv_late_cancel',
  resv_change_date = 'resv_change_date',
  /** Reminder for reservation */
  resv_reminder = 'resv_reminder',
  resv_no_show = 'resv_no_show',
  resv_satisfaction = 'resv_satisfaction',
  resv_internal_cancel = 'resv_internal_cancel',
  resv_footer = 'resv_footer',
  resv_door_info = 'resv_door_info',
  resv_door_info2 = 'resv_door_info2',
  order_review = 'order_review',
  
  gift_online = 'gift_online',

  order_compensate_gift = 'order_compensate_gift',
  order_outstanding_balance = 'order_outstanding_balance',


} 

export enum GiftTemplateCode {
  gift_online_from = 'gift_online_from',
  gift_online_to = 'gift_online_to',
  order_compensate_gift = 'order_compensate_gift'
}
/*
cancel
cancelClient
cancelProvider
*/  
export enum TemplateRecipient {
  unknown = 'unknown',
  client = 'client',
  staff = 'staff',
  provider = 'provider'
}

export enum TemplateChannel {
  email = 'email',
  sms = 'sms',
  wa = 'wa'
}

export class TemplateAction {
  label?: string
  url?: string
}


export enum TemplateFormat {
  text = 'text',
  html = 'html'
}



