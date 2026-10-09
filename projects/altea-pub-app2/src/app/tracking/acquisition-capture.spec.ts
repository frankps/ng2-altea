import { ACQ_STORE_KEY, ACQ_VISIT_KEY, captureTouch, orderAttr, readAcqStore } from './acquisition-capture'
import { contactAcqFromOrder, sanitizeOrderAttr } from 'ts-altea-model'

/** Acquisition capture (Phuket acquisition-capture-spec rev 0.2): ACQ-11, ACQ-25, ACQ-26, ACQ-27, ACQ-30. */
describe('acquisition capture', () => {

  const DAY = 24 * 60 * 60 * 1000
  const t0 = Date.parse('2026-10-03T12:00:00Z')
  const adUrl = () => new URL('https://book.birdy.life/branch/aqua9/open/laser-testbeurt?utm_source=facebook&utm_medium=paid_social&utm_campaign=aq_laser_2026_10&utm_id=1202&ad_id=1299&fbclid=TEST123&gbraid=GB1&prod0=x')

  beforeEach(() => {
    localStorage.removeItem(ACQ_STORE_KEY)
    sessionStorage.removeItem(ACQ_VISIT_KEY)
  })

  it('stores a tagged landing with utm, click ids, platform ids, landing host+path and referrer host', () => {
    captureTouch(adUrl(), 'https://m.facebook.com/path?x=1', t0)
    const last = readAcqStore(t0).last!
    expect(last.utm!['campaign']).toBe('aq_laser_2026_10')
    expect(last.utm!['id']).toBe('1202')
    expect(last.ids!['ad_id']).toBe('1299')
    expect(last.clk!['fbclid']).toBe('TEST123')
    expect(last.clk!['gbraid']).toBe('GB1')
    expect(last.land).toBe('book.birdy.life/branch/aqua9/open/laser-testbeurt')
    expect(last.ref).toBe('m.facebook.com')
    expect(last.at).toBe(new Date(t0).toISOString())
  })

  it('keeps the click across tabs and never overwrites it with an untagged visit', () => {
    captureTouch(adUrl(), '', t0)
    sessionStorage.removeItem(ACQ_VISIT_KEY)   // new tab
    captureTouch(new URL('https://book.birdy.life/branch/aqua9'), '', t0 + 3 * DAY)
    expect(readAcqStore(t0 + 3 * DAY).last!.at).toBe(new Date(t0).toISOString())
  })

  it('replaces last and keeps first on a second tagged landing', () => {
    captureTouch(adUrl(), '', t0)
    captureTouch(new URL('https://book.birdy.life/x?utm_source=google&utm_campaign=wellness&gclid=G1'), '', t0 + DAY)
    const store = readAcqStore(t0 + DAY)
    expect(store.last!.utm!['source']).toBe('google')
    expect(store.first!.utm!['source']).toBe('facebook')
  })

  it('forgets a touch after 90 days', () => {
    captureTouch(adUrl(), '', t0)
    expect(readAcqStore(t0 + 91 * DAY).last).toBeUndefined()
  })

  it('takes landing, referrer and time from a tenant website hand-off (acq_*)', () => {
    captureTouch(new URL('https://book.birdy.life/branch/aqua/open/wellness?utm_source=meta&utm_campaign=wellness&acq_land=aquasense.be%2Fprive-wellness&acq_ref=l.instagram.com&acq_at=2026-10-02T10:00:00Z'), 'https://aquasense.be/', t0)
    const last = readAcqStore(t0).last!
    expect(last.land).toBe('aquasense.be/prive-wellness')
    expect(last.ref).toBe('l.instagram.com')
    expect(last.at).toBe('2026-10-02T10:00:00.000Z')
  })

  it('builds no payload when nothing is known', () => {
    captureTouch(new URL('https://book.birdy.life/branch/aqua9'), '', Date.now())
    const attr = orderAttr()
    // only a visit without referrer (and possibly a pixel cookie in the test browser)
    expect(attr?.last).toBeUndefined()
  })

  it('builds Order.attr from the stored touch', () => {
    captureTouch(adUrl(), 'https://m.facebook.com/', Date.now() - DAY)
    const attr = orderAttr()!
    expect(attr.v).toBe(1)
    expect(attr.last!.utm!['campaign']).toBe('aq_laser_2026_10')
    expect(attr.cons).toBe('unknown')
  })

  it('sanitizer drops unknown keys, wrong versions, future instants and click ids without consent', () => {
    const now = t0
    expect(sanitizeOrderAttr({ v: 2, last: { at: '2026-10-03T11:00:00Z', utm: { source: 'x' } } }, now)).toBeUndefined()
    expect(sanitizeOrderAttr({ v: 1, last: { at: '2030-01-01T00:00:00Z', utm: { source: 'x' } } }, now)).toBeUndefined()
    const a: any = sanitizeOrderAttr({ v: 1, evil: 1, cons: 'denied', match: { fbc: 'x' }, last: { at: '2026-10-03T11:00:00Z', utm: { source: 'x' }, clk: { fbclid: 'F', other: 'z' } } }, now)
    expect(a.evil).toBeUndefined()
    expect(a.match).toBeUndefined()
    expect(a.last.clk).toBeUndefined()
    expect(a.last.utm.source).toBe('x')
  })

  it('Contact.acq copies the facts but never the matching cookies or consent', () => {
    const acq: any = contactAcqFromOrder('o1', '2026-10-03T12:00:00Z', { v: 1, last: { at: '2025-01-01T00:00:00Z', utm: { source: 'old' } }, match: { fbc: 'x' }, cons: 'unknown' })
    expect(acq.kind).toBe('order')
    expect(acq.last.utm.source).toBe('old')
    expect(acq.match).toBeUndefined()
    expect(acq.cons).toBeUndefined()
  })
})
