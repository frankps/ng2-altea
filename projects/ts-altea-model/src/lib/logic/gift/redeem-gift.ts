import { Gift, GiftType } from "../../altea-schema";

/** There are 2 types of gifts: amount or specific
 *  An amount gift: users should select services/products themselves
 *  A specific gift: users can book the specific gift (mode='specific') OR they can select something else (mode='amount'))
 */
export class RedeemGift {

    constructor(public gift: Gift, public mode: GiftType) {}
  }