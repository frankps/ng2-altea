/**
 * Ad click parameters (UTMs, fbclid, gclid) for marketing attribution.
 *
 * Why: visitors from Meta/Google ads land on e.g. /branch/aqua/open/laser-testbeurt?utm_...&fbclid=...
 * The OpenComponent immediately redirects to /orderMode/select-date. When the Meta pixel (loaded
 * async via GTM) starts after that redirect, it no longer sees fbclid and never writes the _fbc
 * cookie, so Meta cannot link the booking to the ad (seen on slow 4G, 30 Sep 2026).
 *
 * Fix:
 * 1. captureAdParams() runs in main.ts BEFORE Angular boots: it writes _fbc itself (Meta's
 *    documented format) and keeps the ad params in sessionStorage for the booking event.
 * 2. adQueryParams() lets redirects carry the ad params along, so GA4 still sees the UTMs.
 *
 * Everything here is best effort: every function catches its own errors and never throws,
 * so a tracking problem can never break the booking flow.
 */

export const AD_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid'
]

export const AD_PARAMS_STORAGE_KEY = 'altea.ad.params'

/** Meta keeps _fbc for 90 days */
const FBC_MAX_AGE_SECONDS = 90 * 24 * 60 * 60

/** Only the known ad params from a query string / params object (other params, e.g. product options, are ignored). */
export function pickAdParams(source: URLSearchParams | Record<string, any> | null | undefined): Record<string, string> {

  const result: Record<string, string> = {}

  try {

    if (!source)
      return result

    for (const key of AD_PARAM_KEYS) {

      const value = source instanceof URLSearchParams ? source.get(key) : source[key]

      if (typeof value === 'string' && value.trim())
        result[key] = value.trim()
    }

  } catch {
    // ignore: attribution is best effort
  }

  return result
}

/** _fbc cookie value in Meta's documented format: fb.1.<creation time in ms>.<fbclid> */
export function fbcValue(fbclid: string, now = Date.now()): string {
  return `fb.1.${now}.${fbclid}`
}

/** Writes _fbc for this fbclid, unless a cookie for the same fbclid already exists (then the pixel or we did it already). */
export function writeFbcCookie(fbclid: string, doc: Document = document, loc: Location = location): void {

  try {

    if (!fbclid)
      return

    const existing = doc.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('_fbc='))

    if (existing && existing.endsWith('.' + fbclid))
      return

    let cookie = `_fbc=${fbcValue(fbclid)}; path=/; max-age=${FBC_MAX_AGE_SECONDS}; SameSite=Lax`

    // same domain as the Meta pixel uses on production (.birdy.life); host-only on localhost / other hosts
    if (loc.hostname === 'birdy.life' || loc.hostname.endsWith('.birdy.life'))
      cookie += '; domain=.birdy.life'

    if (loc.protocol === 'https:')
      cookie += '; Secure'

    doc.cookie = cookie

  } catch {
    // ignore: attribution is best effort
  }
}

/** Ad params stored for this browser session (empty object when none or storage is blocked). */
export function storedAdParams(): Record<string, string> {

  try {
    const raw = sessionStorage.getItem(AD_PARAMS_STORAGE_KEY)
    return raw ? pickAdParams(JSON.parse(raw)) : {}
  } catch {
    return {}
  }
}

/** Call once, before Angular bootstraps (main.ts). Never throws. */
export function captureAdParams(): void {

  try {

    const found = pickAdParams(new URLSearchParams(location.search))

    if (!Object.keys(found).length)
      return

    if (found['fbclid'])
      writeFbcCookie(found['fbclid'])

    try {
      // newest click wins, but keep params from earlier in the session that this URL does not carry
      const merged = { ...storedAdParams(), ...found }
      sessionStorage.setItem(AD_PARAMS_STORAGE_KEY, JSON.stringify(merged))
    } catch {
      // private mode / storage disabled: the cookie above still works
    }

  } catch {
    // ignore: attribution is best effort
  }
}

/** Ad params to carry along on an internal redirect: the ones on the current URL. */
export function adQueryParams(currentQueryParams?: Record<string, any>): Record<string, string> {
  return pickAdParams(currentQueryParams)
}
