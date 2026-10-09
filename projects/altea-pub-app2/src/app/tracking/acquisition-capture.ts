/**
 * Acquisition capture in the browser (Phuket acquisition-capture-spec rev 0.2, ACQ-25 / ACQ-26 / ACQ-11).
 *
 * captureTouch() runs in main.ts BEFORE Angular boots (next to captureAdParams()):
 * - a TAGGED landing (any utm_*, recognised click id or platform id) is kept for 90 days in
 *   localStorage, across tabs: `last` is replaced by every new tagged landing, `first` is kept;
 * - a landing WITHOUT those never overwrites a stored touch (a direct return visit must not erase
 *   the paid click that started the journey);
 * - the visit (first page of this tab: instant, landing, referrer host) goes to sessionStorage.
 *
 * orderAttr() builds Order.attr for a new online order from what was captured.
 *
 * The shapes, allowlists and validation are shared with altea-api in ts-altea-model
 * (lib/marketing/acquisition.ts). Everything here is best effort and never throws:
 * a tracking problem can never break a booking.
 */

import {
  ACQ_CLICK_IDS, ACQ_HORIZON_DAYS, ACQ_LIMITS, ACQ_PLATFORM_IDS,
  AcqConsent, AcqTouch, AcqVisit, OrderAttr, acqInstant, sameTouch, sanitizeOrderAttr
} from 'ts-altea-model'

export const ACQ_STORE_KEY = 'acq.v1'
export const ACQ_VISIT_KEY = 'acq.visit'

interface AcqStore {
  first?: AcqTouch
  last?: AcqTouch
}

function cap(value: string | null | undefined, max = ACQ_LIMITS.value): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function hostOf(url: string | null | undefined): string | undefined {
  try {
    return url ? cap(new URL(url).host, 253) : undefined
  } catch {
    return undefined
  }
}

/** every utm_* parameter, key without the "utm_" prefix */
function utmParams(q: URLSearchParams): Record<string, string> | undefined {

  const result: Record<string, string> = {}
  let count = 0

  q.forEach((value, key) => {
    if (count >= ACQ_LIMITS.keys || !key.startsWith('utm_') || key.length <= 4)
      return
    const v = cap(value)
    if (v && !result[key.slice(4)]) {
      result[key.slice(4)] = v
      count++
    }
  })

  return count ? result : undefined
}

function pickParams(q: URLSearchParams, keys: readonly string[]): Record<string, string> | undefined {

  const result: Record<string, string> = {}

  for (const key of keys) {
    const v = cap(q.get(key))
    if (v)
      result[key] = v
  }

  return Object.keys(result).length ? result : undefined
}

function compact<T extends object>(obj: T): T {
  Object.keys(obj).forEach(key => (obj as any)[key] === undefined && delete (obj as any)[key])
  return obj
}

function readJson<T>(storage: Storage, key: string): T | undefined {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

/** Stored touches, without the ones older than the 90-day horizon. */
export function readAcqStore(now = Date.now()): AcqStore {

  const stored = readJson<AcqStore>(localStorage, ACQ_STORE_KEY) ?? {}
  const result: AcqStore = {}

  if (stored.first && acqInstant(stored.first.at, now)) result.first = stored.first
  if (stored.last && acqInstant(stored.last.at, now)) result.last = stored.last

  return result
}

/** Call once, before Angular bootstraps (main.ts). Never throws. */
export function captureTouch(url: URL = new URL(location.href), referrer: string = document.referrer, now = Date.now()): void {

  try {

    const q = url.searchParams
    const nowIso = new Date(now).toISOString()

    // hand-off from a tenant website or a widget host page (ACQ-26)
    const handLand = cap(q.get('acq_land'))
    const handRef = cap(q.get('acq_ref'), 253)
    const handAt = acqInstant(q.get('acq_at'), now)

    const land = handLand ?? cap(url.host + url.pathname)
    const ref = handRef ?? hostOf(referrer)
    const at = handAt ?? nowIso

    try {
      if (!sessionStorage.getItem(ACQ_VISIT_KEY)) {
        const visit: AcqVisit = compact({ at, land, ref })
        sessionStorage.setItem(ACQ_VISIT_KEY, JSON.stringify(visit))
      }
    } catch {
      // storage blocked: no visit info
    }

    const utm = utmParams(q)
    const clk = pickParams(q, ACQ_CLICK_IDS)
    const ids = pickParams(q, ACQ_PLATFORM_IDS)

    if (!utm && !clk && !ids)   // not tagged: never overwrite a stored touch (ACQ-25)
      return

    const touch: AcqTouch = compact({ at, utm, clk, ids, land, ref })

    const store = readAcqStore(now)

    // a reload of the same landing URL must not move `last` forward
    if (store.last && sameTouch({ ...store.last, at: '' }, { ...touch, at: '' }))
      return

    localStorage.setItem(ACQ_STORE_KEY, JSON.stringify({ first: store.first ?? touch, last: touch }))

  } catch {
    // ignore: attribution is best effort
  }
}

function readCookie(name: string): string | undefined {
  try {
    const cookie = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='))
    return cookie ? cap(decodeURIComponent(cookie.substring(name.length + 1))) : undefined
  } catch {
    return undefined
  }
}

/**
 * Ad-tracking consent at confirm (ACQ-30). book.birdy.life has no consent gate yet, so this is
 * 'unknown'. When a gate is added (e.g. Google Consent Mode / a CMP), read its ad_storage state here.
 */
export function adConsent(): AcqConsent {
  return 'unknown'
}

/** Order.attr for a new online order. Undefined when nothing is known (then nothing is stored). Never throws. */
export function orderAttr(extra: { ask?: string, code?: string } = {}): OrderAttr | undefined {

  try {

    const store = readAcqStore()
    const cons = adConsent()

    const attr: any = { v: 1 }

    if (store.last) attr.last = store.last
    if (store.first && !sameTouch(store.first, store.last)) attr.first = store.first

    const visit = readJson<AcqVisit>(sessionStorage, ACQ_VISIT_KEY)
    if (visit) attr.visit = visit

    if (extra.ask) attr.ask = extra.ask
    if (extra.code) attr.code = extra.code

    if (cons !== 'denied') {
      const match = compact({ fbc: readCookie('_fbc'), fbp: readCookie('_fbp') })
      if (Object.keys(match).length)
        attr.match = match
    }

    attr.cons = cons

    // same validation as the server: allowlists, limits, consent, "no facts → no payload"
    return sanitizeOrderAttr(attr)

  } catch {
    return undefined
  }
}

/** for tests */
export const _acqHorizonDays = ACQ_HORIZON_DAYS
