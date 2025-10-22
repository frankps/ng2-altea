import { NumberHelper, ObjectWithIdPlus } from "ts-common"

export class ReviewParameter {
    code: string
    label: string
    info: string

    static getAll(): ReviewParameter[] {
        return [
            new ReviewParameter('reception', 'Onthaal'),
            new ReviewParameter('polite', 'Vriendelijkheid'),
            new ReviewParameter('advice', 'Advies'),
            new ReviewParameter('quality', 'Kwaliteit behandeling'),
            new ReviewParameter('clean', 'Netheid ruimtes'),
            new ReviewParameter('online', 'Online reserveren')
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

  contactId?: string  

  staffId?: string

  /** name(s) of staff */
  staff?: string

  /** name of customer */
  customer?: string

  /** the average of all parameter ratings */
  rating: number = 0

  /** ratings per parameter */
  params: Record<string, number> = {}

  feedback?: string

  tags?: string[] = []

  hasCustomFeedback(): boolean {
    return this.feedback && this.feedback.trim() !== ''
  }

  addTag(tag: string): boolean {

    tag = tag?.trim()

    if (!tag || tag === '')
      return false

    if (!this.tags)
      this.tags = []

    if (this.tags.indexOf(tag) < 0) {
      this.tags.push(tag)
      return true
    }

    return false
  }
  calculateRating() : number {
    const values = Object.values(this.params)

    if (values.length === 0) {
      this.rating = 0
      return this.rating
    }
  
    this.rating = values.reduce((a, b) => a + b, 0) / values.length

    this.rating = NumberHelper.round(this.rating, 1)

    return this.rating
  }
  
}