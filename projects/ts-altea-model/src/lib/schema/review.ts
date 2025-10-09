import { ObjectWithIdPlus } from "ts-common"

export class ReviewParameter {
    code: string
    label: string
    info: string

    static getAll(): ReviewParameter[] {
        return [
            new ReviewParameter('advice', 'Advies'),
            new ReviewParameter('polite', 'Vriendelijkheid'),
            new ReviewParameter('clean', 'Netheid ruimtes'),
            new ReviewParameter('quality', 'Kwaliteit behandeling'),
            new ReviewParameter('reception', 'Onthaal'),
            new ReviewParameter('online', 'Online reserveren'),
        ]
    }

    constructor(code: string, label: string, info?: string) {
        this.code = code
        this.label = label
        this.info = info
    }
}

export class Review extends ObjectWithIdPlus {

  orderId?: string

  /** name(s) of staff */
  hr?: string

  rating: number = 0

  /** ratings per parameter */
  params: any = {}

  feedback?: string

}