import { Injectable } from '@angular/core'
import { Order, OrderLine } from 'ts-altea-model'

/**
 * Marketing tracking for Meta (Facebook/Instagram) & Google Ads.
 *
 * All events are pushed to the Google Tag Manager dataLayer (container GTM-KLJ4DW4F,
 * loaded in src/index.html). GTM forwards them to the Meta pixel and GA4.
 *
 * Contract (do not change without updating GTM and the Meta custom conversions):
 *
 *   event:       'booking_confirmed'
 *   eventId:     order.id   -> used as Meta 'Event ID' for deduplication with
 *                              server-side Conversions API events (phase 2)
 *   value:       order.incl (total incl. VAT)
 *   paidValue:   order.paid as the browser knows it. On the Stripe path this is
 *                still 0: the payment is booked server-side by the webhook, after
 *                this page loaded. The real amounts come from the backend (phase 2).
 *   paidOnline:  true when an online payment just succeeded
 *   currency:    'EUR'
 *   productMain: slug of the first order line (= the offer that was advertised)
 *   products:    slugs of all order lines. Do not change this shape: it feeds
 *                content_ids on the live Meta pixel tag.
 *
 * Added beside products (index-aligned). The URL is a shortened copy of the same
 * data: prod<p>, opt<p>_<o>, val<p>_<o>, sel<p>, oid.
 *
 *   productOptions, sel, selMain
 *
 * The same contract will be reused in Phuket, so only the emitting code changes.
 */

const MAX_PRODUCTS = 3
const MAX_OPTIONS = 3
const MAX_VALUES = 5
const MAX_SEL_LENGTH = 200

export interface TrackingOption {
  slug: string
  values: string[]
}

export interface TrackingProduct {
  slug: string
  options: TrackingOption[]
}

/** Resolution order: stored slug -> derived from name -> undefined */
export function trackingSlug(stored?: string, name?: string): string | undefined {
  const raw = stored?.trim() || name?.trim()
  if (!raw)
    return undefined
  return slugify(raw) || undefined
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
}

@Injectable({ providedIn: 'root' })
export class TrackingService {

  /** orders already tracked in this browser: avoids double counting when the
   *  customer refreshes or when both the payment flow and the order flow report. */
  static readonly storageKey = 'altea.tracked.orders'

  /** stable product identifier: slug first, product name only as fallback */
  productSlug(line?: OrderLine): string | undefined {

    if (!line)
      return undefined

    return trackingSlug(line.product?.slug, line.product?.name)
  }

  productSlugs(order?: Order): string[] {

    if (!order?.lines?.length)
      return []

    return order.lines.map((line: OrderLine) => this.productSlug(line)).filter((slug?: string) => !!slug) as string[]
  }

  /** Reads the order, resolves every slug, sorts options and values.
   *  Does not apply the URL limits: the dataLayer event keeps the full structure. */
  trackingProducts(order?: Order): TrackingProduct[] {

    try {

      if (!order?.lines?.length)
        return []

      const products: TrackingProduct[] = []

      for (const line of order.lines) {

        const slug = this.productSlug(line)

        if (!slug)
          continue

        const options: TrackingOption[] = []

        for (const opt of line.options ?? []) {

          const optSlug = trackingSlug(opt?.slug, opt?.name)

          if (!optSlug)
            continue

          const values: string[] = []

          for (const val of opt.values ?? []) {
            const valSlug = trackingSlug(val?.slug, val?.name)
            if (valSlug)
              values.push(valSlug)
          }

          values.sort()

          if (!values.length)
            continue

          options.push({ slug: optSlug, values })
        }

        options.sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)

        products.push({ slug, options })
      }

      return products

    } catch (err) {
      console.warn('TrackingService.trackingProducts failed', err)
      return []
    }
  }

  /** Builds sel for one product. Always derived, never stored. */
  selKey(product: TrackingProduct): string {

    try {

      const parts = [product.slug]

      for (const opt of product.options ?? []) {
        for (const value of opt.values ?? [])
          parts.push(`${opt.slug}-${value}`)
      }

      return parts.join('~')

    } catch (err) {
      console.warn('TrackingService.selKey failed', err)
      return product?.slug ?? ''
    }
  }

  /** Query params for the confirmation URL. Limited and sorted.
   *  On failure, falls back to prod0 + oid so the existing Meta conversions still match. */
  trackingQueryParams(order?: Order): Record<string, string> {

    try {

      const params: Record<string, string> = {}

      if (!order)
        return params

      if (order.id)
        params['oid'] = order.id

      this.trackingProducts(order).slice(0, MAX_PRODUCTS).forEach((prod, p) => {

        params[`prod${p}`] = prod.slug

        const options = prod.options.slice(0, MAX_OPTIONS).map(opt => ({
          slug: opt.slug,
          values: opt.values.slice(0, MAX_VALUES)
        })).filter(opt => !!opt.slug && opt.values.length > 0)

        const sel = this.selKey({ slug: prod.slug, options }).slice(0, MAX_SEL_LENGTH)

        if (sel)
          params[`sel${p}`] = sel

        options.forEach((opt, o) => {
          params[`opt${p}_${o}`] = opt.slug
          params[`val${p}_${o}`] = opt.values.join('.')
        })
      })

      return params

    } catch (err) {
      console.warn('TrackingService.trackingQueryParams failed', err)
      return this.fallbackQueryParams(order)
    }
  }

  /** Booking confirmed: free test session (paid = 0) or paid appointment.
   *  @param opts.paidOnline set by the Stripe flow: an online payment succeeded,
   *         even though the amount is not known in the browser yet. */
  bookingConfirmed(order?: Order, opts?: { paidOnline?: boolean }): void {

    try {

      if (!order?.id || this.alreadyTracked(order.id))
        return

      const slugs = this.productSlugs(order)

      const event: any = {
        event: 'booking_confirmed',
        eventId: order.id,
        orderId: order.id,
        value: order.incl ?? 0,
        paidValue: order.paid ?? 0,
        paidOnline: opts?.paidOnline ?? ((order.paid ?? 0) > 0),
        currency: 'EUR',
        productMain: slugs[0],
        products: slugs,
        branch: order.branchId
      }

      try {

        const tracked = this.trackingProducts(order)

        event.productOptions = tracked.map(prod => ({
          slug: prod.slug,
          options: Object.fromEntries(prod.options.map(opt => [opt.slug, opt.values]))
        }))
        event.sel = tracked.map(prod => this.selKey(prod))

        if (event.sel.length)
          event.selMain = event.sel[0]

      } catch (err) {
        console.warn('TrackingService option fields failed', err)
      }

      this.push(event)

      this.markTracked(order.id)

    } catch (err) {
      console.warn('TrackingService.bookingConfirmed failed', err)
    }
  }

  /** What the confirmation URL carried before options existed. */
  protected fallbackQueryParams(order?: Order): Record<string, string> {

    const params: Record<string, string> = {}

    try {

      if (!order)
        return params

      if (order.id)
        params['oid'] = order.id

      const prod0 = this.productSlug(order.lines?.[0])

      if (prod0)
        params['prod0'] = prod0

    } catch {
      // still return whatever we managed to build
    }

    return params
  }

  protected push(event: any): void {

    const w = window as any

    w.dataLayer = w.dataLayer || []
    w.dataLayer.push(event)

    console.log('tracking', event)
  }

  protected trackedOrders(): string[] {

    try {
      const raw = localStorage.getItem(TrackingService.storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  protected alreadyTracked(orderId: string): boolean {
    return this.trackedOrders().indexOf(orderId) >= 0
  }

  protected markTracked(orderId: string): void {

    try {
      const orders = this.trackedOrders()
      orders.push(orderId)

      // keep the list short
      const recent = orders.slice(-50)

      localStorage.setItem(TrackingService.storageKey, JSON.stringify(recent))
    } catch {
      // private mode / storage disabled: tracking still works, dedup does not
    }
  }
}
