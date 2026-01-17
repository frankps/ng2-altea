
import { Branch, Contact, DepositMode, DurationMode, DurationReference, Gender, Gift, Invoice, LoyaltyCard, OnlineMode, Order, OrderLine, OrderType, Organisation, Product, ProductOnlineIcons, ProductTypeIcons, Resource, ResourcePlanning, Schedule, Subscription, Task, Template, User, UserBase } from "ts-altea-model";
import { Exclude, Type, Transform } from "class-transformer";
import 'reflect-metadata';
import { ArrayHelper, ConnectTo, DateHelper, DbObjectCreate, IAsDbObject, ManagedObject, ObjectHelper, ObjectMgmt, ObjectReference, ObjectWithId, ObjectWithIdPlus, QueryOperator, TimeHelper } from 'ts-common'
import * as _ from "lodash";
import { PersonLine } from "../person-line";
import { DateRange, DateRangeSet, TimeBlock, TimeBlockSet, TimeSpan } from "../logic";
import * as dateFns from 'date-fns'
import * as Handlebars from "handlebars"
import * as sc from 'stringcase'
import { OrderPersonMgr } from "../order-person-mgr";
import { CancelOrderMessage } from "ts-altea-logic";


/** When a message is sent originating from a template, we can keep track of it
 *  Introduced for contact reactivation:
 *  - we can keep track of which contacts have received which messages
 *  - we can keep track of which contacts have not received a message for a given period
 */
export class TemplateMessage extends ObjectWithIdPlus {

    constructor() {
      super()
    }
    
    static create(templateId: string, contactId: string, cat: string, code: string, suffix: string, remind: number) {

      const templateMessage = new TemplateMessage()
      templateMessage.templateId = templateId
      templateMessage.contactId = contactId
      templateMessage.cat = cat
      templateMessage.code = code
      templateMessage.suffix = suffix
      templateMessage.remind = remind

      
      return templateMessage

    }


    contactId?: string;
  
    @Type(() => Contact)
    contact?: Contact;


    templateId?: string;
  
    @Type(() => Template)
    template?: Template;
  
    cat?: string;
    code?: string;
    remind?: number;
    suffix?: string;

    subject?: string;
    body?: string;
    short?: string; // for SMS or other messaging

  }
  