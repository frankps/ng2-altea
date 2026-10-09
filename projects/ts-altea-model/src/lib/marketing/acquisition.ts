/**
 * Acquisition capture — shared contract for Order.attr and Contact.acq.
 *
 * Authority: Phuket repo, docs/spec/marketing/acquisition-capture-spec.md (rev 0.2), rules ACQ-*.
 * Used by the booking app (builds the payload), altea-api (validates and guards it) and,
 * later, the Phuket reports (read it). Pure TypeScript: no DOM, no Node, no Prisma.
 *
 * Rule of thumb (ACQ-04): store raw facts verbatim, never resolve a campaign at write time.
 */

/** One landing that carried a utm_*, a recognised click id or a recognised platform id. */
export interface AcqTouch {
  /** ISO 8601 UTC instant of the click capture (ACQ-09). Not a packed wall-clock stamp. */
  at: string
  /** every utm_* parameter, key WITHOUT the "utm_" prefix: source, medium, campaign, content, term, id, … */
  utm?: Record<string, string>
  /** click ids by URL parameter name, see ACQ_CLICK_IDS */
  clk?: Record<string, string>
  /** ad-platform object ids from URL templates, see ACQ_PLATFORM_IDS */
  ids?: Record<string, string>
  /** landing host + path, never the query string (ACQ-10) */
  land?: string
  /** referrer host only */
  ref?: string
}

/** The visit (browser tab) in which the booking was made. */
export interface AcqVisit {
  at: string
  land?: string
  ref?: string
}

export type AcqConsent = 'granted' | 'denied' | 'unknown'

/** Order.attr — how THIS booking was won. Write-once (ACQ-12). */
export interface OrderAttr {
  v: 1
  /** most recent tagged touch, at most ACQ_HORIZON_DAYS old ← attribution */
  last?: AcqTouch
  /** earliest kept tagged touch, only when different from last */
  first?: AcqTouch
  visit?: AcqVisit
  /** self-reported answer key (ACQ-15) */
  ask?: string
  /** promo code entered on this order */
  code?: string
  /** Meta cookies at confirm: Conversions API matching input, not attribution */
  match?: { fbc?: string; fbp?: string }
  /** ad-tracking consent at confirm (ACQ-30) */
  cons?: AcqConsent
}

/** Contact.acq — how THIS client was acquired. Frozen once written (ACQ-13, ACQ-28). */
export type ContactAcq =
  | {
    v: 1; kind: 'order'
    /** the first qualifying order */
    oid: string
    /** ISO instant: confirmation when frozen live, order creation when derived afterwards */
    at: string
    last?: AcqTouch; first?: AcqTouch; visit?: AcqVisit; ask?: string; code?: string
    /** set when `oid` is a guest order ("Snel reserveren", no contactId) matched to this contact by
     *  e-mail or mobile, not an order linked to the contact (ACQ-32) */
    link?: 'email' | 'mobile'
  }
  | { v: 1; kind: 'before'; at: string }
  | { v: 1; kind: 'import'; at: string; src?: string }


/** Click ids we recognise (ACQ-22). Adding a platform = adding a name here, never a schema change. */
export const ACQ_CLICK_IDS: readonly string[] = [
  'fbclid',                                   // Meta
  'gclid', 'gbraid', 'wbraid', 'dclid',       // Google (gbraid/wbraid replace gclid on much iOS traffic)
  'msclkid',                                  // Microsoft
  'ttclid',                                   // TikTok
  'li_fat_id',                                // LinkedIn
  'epik',                                     // Pinterest
  'ScCid',                                    // Snapchat
  'twclid',                                   // X
  'rdt_cid'                                   // Reddit
]

/** Platform object ids passed through URL templates (ACQ-22, spec §13). The campaign id travels in utm_id. */
export const ACQ_PLATFORM_IDS: readonly string[] = ['adset_id', 'ad_id', 'adgroupid', 'creative']

/** Hand-off parameters from a tenant website or widget host page (ACQ-26). */
export const ACQ_HANDOFF_PARAMS: readonly string[] = ['acq_land', 'acq_ref', 'acq_at']

/** How long the browser keeps a tagged touch. The attribution window itself is a read-time constant (ACQ-04a). */
export const ACQ_HORIZON_DAYS = 90

/** Order states that make an order "qualifying" for acquisition (ACQ-13). */
export const ACQ_QUALIFYING_STATES: readonly string[] = ['confirmed', 'arrived', 'finished']

/** Self-reported answer keys (ACQ-15). Keys are stored, labels live in the UI. */
export const ACQ_ASK_KEYS: readonly string[] = ['google', 'facebook', 'instagram', 'friend', 'flyer', 'passing', 'other']

/**
 * Contacts created before this instant existed before capture went live and are stamped
 * kind 'before': they can never be credited as acquired by a campaign (ACQ-28). Contacts created
 * afterwards are genuinely new. Erring early is harmless (a contact created between this instant
 * and the deploy is still a new client); erring late would hide real acquisitions.
 * Tenants migrated onto the platform later must stamp their imported contacts kind 'import'.
 */
export const ACQ_CAPTURE_START = '2026-10-03T00:00:00Z'

export const ACQ_LIMITS = {
  /** max keys per map */
  keys: 32,
  /** max characters per value */
  value: 256,
  /** max size of the serialised payload (bytes, approximated by characters) */
  bytes: 4096,
  /** allowed clock skew for an instant in the future */
  skewMs: 5 * 60 * 1000
}

const KEY_RE = /^[A-Za-z0-9_.-]{1,64}$/

const DAY_MS = 24 * 60 * 60 * 1000

function cleanString(value: any, max = ACQ_LIMITS.value): string | undefined {
  if (typeof value !== 'string')
    return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function cleanMap(value: any, allow?: readonly string[]): Record<string, string> | undefined {

  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined

  const result: Record<string, string> = {}
  let count = 0

  for (const [key, raw] of Object.entries(value)) {

    if (count >= ACQ_LIMITS.keys)
      break

    if (!KEY_RE.test(key) || (allow && allow.indexOf(key) < 0))
      continue

    const str = cleanString(raw)
    if (str) {
      result[key] = str
      count++
    }
  }

  return count ? result : undefined
}

/** A valid ISO instant, not in the future (beyond skew) and not older than horizonDays. Returned normalised. */
export function acqInstant(value: any, now = Date.now(), horizonDays = ACQ_HORIZON_DAYS): string | undefined {

  if (typeof value !== 'string' || value.length > 40)
    return undefined

  const time = Date.parse(value)

  if (isNaN(time) || time > now + ACQ_LIMITS.skewMs || time < now - horizonDays * DAY_MS)
    return undefined

  return new Date(time).toISOString()
}

function cleanTouch(value: any, now: number, horizonDays: number): AcqTouch | undefined {

  if (!value || typeof value !== 'object')
    return undefined

  const at = acqInstant(value.at, now, horizonDays)
  if (!at)
    return undefined

  const touch: AcqTouch = { at }

  const utm = cleanMap(value.utm)
  const clk = cleanMap(value.clk, ACQ_CLICK_IDS)
  const ids = cleanMap(value.ids, ACQ_PLATFORM_IDS)

  if (!utm && !clk && !ids)   // not a tagged touch
    return undefined

  if (utm) touch.utm = utm
  if (clk) touch.clk = clk
  if (ids) touch.ids = ids

  const land = cleanString(value.land)
  const ref = cleanString(value.ref, 253)
  if (land) touch.land = land
  if (ref) touch.ref = ref

  return touch
}

function cleanVisit(value: any, now: number, horizonDays: number): AcqVisit | undefined {

  if (!value || typeof value !== 'object')
    return undefined

  const at = acqInstant(value.at, now, horizonDays)
  if (!at)
    return undefined

  const visit: AcqVisit = { at }
  const land = cleanString(value.land)
  const ref = cleanString(value.ref, 253)
  if (land) visit.land = land
  if (ref) visit.ref = ref

  return visit
}

export function sameTouch(a?: AcqTouch, b?: AcqTouch): boolean {
  if (!a || !b)
    return false
  return JSON.stringify(a) === JSON.stringify(b)
}

/** True when the payload holds anything worth storing (ACQ-11): no payload at all otherwise. */
export function hasAcqFacts(attr?: Partial<OrderAttr>): boolean {
  return !!(attr && (attr.last || attr.visit?.ref || attr.ask || attr.code || attr.match))
}

/**
 * Validates an Order.attr payload (ACQ-23, ACQ-27). Keeps only the known keys, enforces the limits,
 * drops touches with an invalid or out-of-horizon instant (pass horizonDays = Infinity for a payload
 * that was already stored). Returns undefined when nothing is left.
 * Never throws. Used in the browser (before sending) and on the server (before storing).
 */
export function sanitizeOrderAttr(input: any, now = Date.now(), horizonDays = ACQ_HORIZON_DAYS): OrderAttr | undefined {

  try {

    if (!input || typeof input !== 'object' || input.v !== 1)
      return undefined

    const attr: OrderAttr = { v: 1 }

    const last = cleanTouch(input.last, now, horizonDays)
    const first = cleanTouch(input.first, now, horizonDays)
    const visit = cleanVisit(input.visit, now, horizonDays)

    if (last) attr.last = last
    if (first && !sameTouch(first, last)) attr.first = first
    if (visit) attr.visit = visit

    const ask = cleanString(input.ask, 32)
    if (ask && KEY_RE.test(ask)) attr.ask = ask

    const code = cleanString(input.code, 64)
    if (code) attr.code = code

    if (input.match && typeof input.match === 'object') {
      const fbc = cleanString(input.match.fbc)
      const fbp = cleanString(input.match.fbp)
      if (fbc || fbp) {
        attr.match = {}
        if (fbc) attr.match.fbc = fbc
        if (fbp) attr.match.fbp = fbp
      }
    }

    if (input.cons === 'granted' || input.cons === 'denied' || input.cons === 'unknown')
      attr.cons = input.cons

    if (attr.cons === 'denied') {   // keep which ad, drop who clicked (ACQ-30)
      delete attr.match
      if (attr.last) delete attr.last.clk
      if (attr.first) delete attr.first.clk
    }

    if (!hasAcqFacts(attr))
      return undefined

    // size limit: drop the least important parts first
    if (JSON.stringify(attr).length > ACQ_LIMITS.bytes) delete attr.first
    if (JSON.stringify(attr).length > ACQ_LIMITS.bytes) delete attr.visit
    if (JSON.stringify(attr).length > ACQ_LIMITS.bytes) return undefined

    return attr

  } catch {
    return undefined
  }
}

/** Contact.acq for a client acquired through an order (ACQ-13). Copies the facts, never match/cons. */
export function contactAcqFromOrder(orderId: string, at: Date | string, attr?: any, link?: 'email' | 'mobile'): ContactAcq {

  const acq: ContactAcq = { v: 1, kind: 'order', oid: orderId, at: new Date(at).toISOString() }

  if (link)
    acq.link = link

  // a stored payload: validate the shape again, but do not re-apply the 90-day horizon
  const clean = sanitizeOrderAttr(attr, Date.now(), Number.POSITIVE_INFINITY)

  if (clean) {
    if (clean.last) acq.last = clean.last
    if (clean.first) acq.first = clean.first
    if (clean.visit) acq.visit = clean.visit
    if (clean.ask) acq.ask = clean.ask
    if (clean.code) acq.code = clean.code
  }

  return acq
}

/** Contact.acq for a contact that existed before capture went live (ACQ-28). */
export function contactAcqBefore(at = ACQ_CAPTURE_START): ContactAcq {
  return { v: 1, kind: 'before', at: new Date(at).toISOString() }
}

/** E-mail as used for matching guest orders to contacts (ACQ-32): trimmed, lower case, must contain '@'. */
export function acqNormEmail(email?: string | null): string | undefined {
  const e = email?.trim().toLowerCase()
  return e && e.indexOf('@') > 0 ? e : undefined
}

/** Mobile as used for matching guest orders to contacts (ACQ-32): digits only, no leading 00, at least 8 digits. */
export function acqNormMobile(mobile?: string | null): string | undefined {
  const m = mobile?.replace(/[^0-9]/g, '').replace(/^00/, '')
  return m && m.length >= 8 ? m : undefined
}
