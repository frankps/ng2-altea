import { Order, OrderLineOption, ProductOption, ProductOptionValue } from 'ts-altea-model'
import { slugify, trackingSlug, TrackingService } from './tracking.service'

const ORDER_ID = '93d86f70-0dbd-4a23-a892-f5d0a924bcd8'
const BRANCH_ID = '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'

interface MakeValue {
  slug?: string
  name?: string
}

interface MakeOption {
  slug?: string
  name?: string
  values: Array<string | MakeValue>
}

interface MakeProduct {
  slug?: string
  name?: string
  options: MakeOption[]
}

function makeOrder(products: MakeProduct[], id = ORDER_ID): Order {

  return {
    id,
    branchId: BRANCH_ID,
    incl: 0,
    paid: 0,
    lines: products.map(product => ({
      product: { slug: product.slug, name: product.name },
      options: product.options.map(option => ({
        slug: option.slug,
        name: option.name,
        values: option.values.map(value => typeof value === 'string' ? { slug: value } : value)
      }))
    }))
  } as Order
}

describe('slugify', () => {
  it('lowercases and replaces separators', () => {
    expect(slugify('Bovenlip')).toBe('bovenlip')
    expect(slugify('Volledige benen')).toBe('volledige_benen')
  })
  it('strips punctuation and collapses runs', () => {
    expect(slugify('Wenkbrauwen (neusbrug)')).toBe('wenkbrauwen_neusbrug')
  })
  it('removes accents', () => {
    expect(slugify('Onderbenen incl. knieën')).toBe('onderbenen_incl_knieen')
    expect(slugify('Crème')).toBe('creme')
  })
  it('caps at 40 characters', () => {
    expect(slugify('a'.repeat(60)).length).toBe(40)
  })
  it('returns empty string for junk', () => {
    expect(slugify('   ...   ')).toBe('')
  })
})

describe('trackingSlug', () => {
  it('prefers the stored slug', () => {
    expect(trackingSlug('oksels', 'Bovenarmen tot oksels')).toBe('oksels')
  })
  it('falls back to the name', () => {
    expect(trackingSlug(undefined, 'Bovenarmen tot oksels'))
      .toBe('bovenarmen_tot_oksels')
  })
  it('returns undefined when both are empty', () => {
    expect(trackingSlug(undefined, undefined)).toBeUndefined()
    expect(trackingSlug('   ', '  ')).toBeUndefined()
  })
})

describe('trackingQueryParams', () => {
  let svc: TrackingService

  beforeEach(() => {
    svc = new TrackingService()
  })

  it('keeps the live product slugs stable', () => {
    expect(svc.productSlug({ product: { slug: 'laser_testbeurt' } } as any)).toBe('laser_testbeurt')
    expect(svc.productSlug({ product: { slug: 'wellness' } } as any)).toBe('wellness')
    expect(svc.productSlug({ product: { slug: 'cerelift-pro' } } as any)).toBe('cerelift_pro')
  })

  it('emits prod and sel for a product without options', () => {
    const order = makeOrder([{ slug: 'wellness', options: [] }])
    expect(svc.trackingQueryParams(order)).toEqual({
      oid: ORDER_ID, prod0: 'wellness', sel0: 'wellness'
    })
  })

  it('emits one option with one value', () => {
    const order = makeOrder([
      { slug: 'laser_testbeurt', options: [{ slug: 'zone', values: ['oksels'] }] }
    ])
    expect(svc.trackingQueryParams(order)).toEqual({
      oid: ORDER_ID,
      prod0: 'laser_testbeurt',
      opt0_0: 'zone',
      val0_0: 'oksels',
      sel0: 'laser_testbeurt~zone-oksels'
    })
  })

  it('joins multiSelect values with a dot, sorted', () => {
    const order = makeOrder([
      {
        slug: 'laser_testbeurt',
        options: [{ slug: 'zone', values: ['oksels', 'bikini'] }]
      }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['val0_0']).toBe('bikini.oksels')
    expect(p['sel0']).toBe('laser_testbeurt~zone-bikini~zone-oksels')
  })

  it('sorts options by slug, not by input order', () => {
    const order = makeOrder([
      {
        slug: 'cerelift_pro', options: [
          { slug: 'zone', values: ['gelaat'] },
          { slug: '6extra', values: ['ja'] }
        ]
      }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['opt0_0']).toBe('6extra')
    expect(p['opt0_1']).toBe('zone')
    expect(p['sel0']).toBe('cerelift_pro~6extra-ja~zone-gelaat')
  })

  it('indexes multiple products', () => {
    const order = makeOrder([
      { slug: 'laser_testbeurt', options: [{ slug: 'zone', values: ['oksels'] }] },
      { slug: 'wellness', options: [] }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['prod1']).toBe('wellness')
    expect(p['sel1']).toBe('wellness')
    expect(p['opt1_0']).toBeUndefined()
  })

  it('derives slugs from names when an existing order has none stored', () => {
    const order = makeOrder([
      {
        name: 'Laser testbeurt',
        options: [{
          name: 'Zone',
          values: [{ name: 'Oksels' }, { name: 'Wenkbrauwen (neusbrug)' }]
        }]
      }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['prod0']).toBe('laser_testbeurt')
    expect(p['opt0_0']).toBe('zone')
    expect(p['val0_0']).toBe('oksels.wenkbrauwen_neusbrug')
    expect(p['sel0']).toBe('laser_testbeurt~zone-oksels~zone-wenkbrauwen_neusbrug')
  })

  it('prefers a stored value slug over the name', () => {
    const order = makeOrder([
      {
        slug: 'laser_testbeurt',
        options: [{
          slug: 'zone',
          values: [{ slug: 'oksels', name: 'Bovenarmen tot oksels' }]
        }]
      }
    ])
    expect(svc.trackingQueryParams(order)['val0_0']).toBe('oksels')
  })

  it('applies the limits', () => {
    const order = makeOrder([{
      slug: 'x', options: [
        { slug: 'a', values: ['1'] }, { slug: 'b', values: ['1'] },
        { slug: 'c', values: ['1'] }, { slug: 'd', values: ['1'] }
      ]
    }])
    const p = svc.trackingQueryParams(order)
    expect(p['opt0_3']).toBeUndefined()
    expect(p['opt0_2']).toBe('c')
    expect(p['sel0'].length).toBeLessThanOrEqual(200)
  })

  it('keeps at most 5 values and 3 products', () => {
    const order = makeOrder([
      { slug: 'p0', options: [{ slug: 'zone', values: ['f', 'e', 'd', 'c', 'b', 'a'] }] },
      { slug: 'p1', options: [] },
      { slug: 'p2', options: [] },
      { slug: 'p3', options: [] }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['val0_0']).toBe('a.b.c.d.e')
    expect(p['prod2']).toBe('p2')
    expect(p['prod3']).toBeUndefined()
  })

  it('caps sel at 200 characters', () => {
    const long = 'a'.repeat(40)
    const order = makeOrder([{
      slug: long,
      options: ['a', 'b', 'c'].map(slug => ({
        slug,
        values: ['1', '2', '3', '4', '5'].map(n => slug + n + long)
      }))
    }])
    const p = svc.trackingQueryParams(order)
    expect(p['sel0'].length).toBe(200)
  })

  it('never emits an empty parameter', () => {
    const order = makeOrder([{ slug: 'x', options: [{ slug: 'zone', values: [] }, { name: '...', values: ['ok'] }] }])
    const p = svc.trackingQueryParams(order)
    Object.values(p).forEach(v => expect(v).not.toBe(''))
    expect(p['opt0_0']).toBeUndefined()
  })

  it('survives a missing order', () => {
    expect(svc.trackingQueryParams(undefined)).toEqual({})
  })

  it('skips a line without a product and still emits the next one', () => {
    const order = makeOrder([
      { options: [] },
      { slug: 'laser_testbeurt', options: [] }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['prod0']).toBe('laser_testbeurt')
    expect(p['prod1']).toBeUndefined()
  })
})

describe('tracking regressions', () => {
  let svc: TrackingService
  let fullOrder: Order

  beforeEach(() => {
    svc = new TrackingService()
    fullOrder = makeOrder([
      {
        slug: 'laser_testbeurt',
        options: [
          { slug: 'zone', values: ['oksels', 'bikini'] },
          { name: 'Extra = optie', values: [{ name: 'Ja: graag' }] }
        ]
      },
      { slug: 'wellness', options: [] }
    ])
  })

  it('emits no character that breaks a query string', () => {
    const p = svc.trackingQueryParams(fullOrder)
    Object.values(p).forEach(v => {
      expect(v).not.toContain('=')
      expect(v).not.toContain(':')
      expect(v).not.toContain(' ')
      expect(v).toMatch(/^[a-z0-9_.~-]+$/i)
    })
  })

  it('survives the auth redirect parser in auth.service.ts', () => {
    const params = svc.trackingQueryParams(fullOrder)
    const qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')

    const parsed: Record<string, string> = {}
    qs.split('&').forEach(pair => {
      const [key, value] = pair.split('=')
      if (key)
        parsed[key] = value ? decodeURIComponent(value) : ''
    })

    expect(parsed).toEqual(params)
  })

  it('copies slug onto the order line so a later rename does not change the url', () => {
    const prodOpt = new ProductOption()
    prodOpt.id = 'o1'
    prodOpt.name = 'Zone'
    prodOpt.slug = 'zone'

    const val = new ProductOptionValue()
    val.id = 'v1'
    val.name = 'Bovenarmen tot oksels'
    val.slug = 'oksels'
    prodOpt.values = [val]

    const ol = OrderLineOption.fromProductOption(prodOpt, true)
    expect(ol.slug).toBe('zone')
    expect(ol.values[0].slug).toBe('oksels')

    const built = new OrderLineOption(prodOpt, val)
    expect(built.slug).toBe('zone')
    expect(built.values[0].slug).toBe('oksels')
  })
})

describe('bookingConfirmed', () => {
  let svc: TrackingService

  beforeEach(() => {
    svc = new TrackingService()
    localStorage.removeItem(TrackingService.storageKey)
    ;(window as any).dataLayer = []
  })

  function confirmedEvents(): any[] {
    return ((window as any).dataLayer as any[]).filter(e => e.event === 'booking_confirmed')
  }

  it('adds productOptions and sel beside the existing products array', () => {
    const order = makeOrder([
      { slug: 'laser_testbeurt', options: [{ slug: 'zone', values: ['oksels', 'bikini'] }] }
    ])

    svc.bookingConfirmed(order, { paidOnline: true })

    const event = confirmedEvents()[0]
    expect(event.products).toEqual(['laser_testbeurt'])
    expect(event.productMain).toBe('laser_testbeurt')
    expect(event.paidOnline).toBe(true)
    expect(event.productOptions).toEqual([
      { slug: 'laser_testbeurt', options: { zone: ['bikini', 'oksels'] } }
    ])
    expect(event.sel).toEqual(['laser_testbeurt~zone-bikini~zone-oksels'])
    expect(event.selMain).toBe('laser_testbeurt~zone-bikini~zone-oksels')
  })

  it('uses an empty options object when the product has none', () => {
    svc.bookingConfirmed(makeOrder([{ slug: 'wellness', options: [] }]))
    const event = confirmedEvents()[0]
    expect(event.productOptions).toEqual([{ slug: 'wellness', options: {} }])
    expect(event.sel).toEqual(['wellness'])
    expect(event.selMain).toBe('wellness')
  })

  it('does not fire a second event for the same order', () => {
    const order = makeOrder([{ slug: 'wellness', options: [] }])
    svc.bookingConfirmed(order)
    svc.bookingConfirmed(order)
    expect(confirmedEvents().length).toBe(1)
  })

  it('still records the booking when dataLayer was removed', () => {
    delete (window as any).dataLayer
    expect(() => svc.bookingConfirmed(makeOrder([{ slug: 'wellness', options: [] }]))).not.toThrow()
    expect(confirmedEvents().length).toBe(1)
  })
})
