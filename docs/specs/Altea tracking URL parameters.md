# Altea tracking URL parameters

Sep 27, 2026 · @Frank Paepens

Spec for encoding product options into the confirmation URL and the dataLayer event, so Meta and Google can attribute bookings per option value (laser zone, and anything else later). Written for implementation in `altea-pub-app2` and `ts-altea-model`.

## Purpose

Today the confirmation URL carries only the product: `?prod0=laser_testbeurt&oid=<uuid>`. One laser test session looks identical whether the client booked oksels or volledige benen, so Meta cannot tell which zone an ad produced and we cannot optimise per zone.

This spec adds the selected **options** to that URL and to the `booking_confirmed` dataLayer event, generically — not laser-specific. Any product with options benefits.

### The gap that has to be closed first

`ProductOption` already has a `slug` field, documented as *"used in url"*. **`ProductOptionValue` has no slug** — only `name`, `idx` and `value`.

That matters, because deriving the value slug from `name` recreates exactly the bug we spent September fixing: renaming *"Wenkbrauwen (neusbrug)"* to *"Wenkbrauwen"* would silently change `wenkbrauwen_neusbrug` to `wenkbrauwen`, and every Meta conversion rule matching the old string would quietly stop counting. That is how the old laser conversion recorded zero events for 162 days while the campaign kept spending.

So: **add `slug` to `ProductOptionValue`**, derive it from the name only as a fallback.

### One thing that shapes the whole design

The zone option on *Laserontharing – vrouw* has **multiSelect enabled** — a client can book oksels *and* bikini in one line. Multiple values per option is the normal case here, not an edge case, and the encoding has to handle it without becoming unreadable.

### Existing convention to stay consistent with

Inbound marketing links already use option slugs as query parameters:

```
https://book.birdy.life/branch/aqua/open/cerelift-pro?6extra=1
```

That is `/open/<product.slug>?<option.slug>=<value>` and it stays exactly as it is. This spec covers the **outbound** confirmation URL, which has different requirements: it may carry several products, and Meta's custom conversions can only do plain substring matching on it.

## Data model changes

Three changes. Only the first needs a database migration.

### 1. `ProductOptionValue.slug` — Prisma migration

```prisma
model ProductOptionValue {
  // ... existing fields
  name  String
  slug  String?   // NEW - used in url, mirrors ProductOption.slug
  descr String?
  // ...
}
```

Nullable, so the migration is additive and nothing breaks. Backfill with the derived slug (see the slug rules section) in the same migration, then let staff correct the ones that matter. The admin UI needs the field exposed next to `name` in the *Mogelijke keuzes* table — same treatment as `ProductOption.slug` has today.

### 2. Carry slugs into the order line — `ts-altea-model`, no migration

`OrderLine.options` is a Json column holding `OrderLineOption[]`. Today the constructor copies `id` and `name` from `ProductOption`, and `id`, `name`, `dur`, `prc`, `val`, `d` from `ProductOptionValue`. **Neither carries the slug**, so at the moment we build the confirmation URL the slug is not available on the order.

Add it in both classes:

```ts
// src/lib/schema/order-line.ts

export class OrderLineOption extends ObjectWithId {
  name?: string
  slug?: string          // NEW
  // ...
  constructor(productOption?: ProductOption, ...productOptionValues: ProductOptionValue[]) {
    // ...
    this.id = productOption.id
    this.name = productOption.name
    this.slug = productOption.slug     // NEW
    // ...
  }
}

export class OrderLineOptionValue extends ObjectWithId {
  name?: string
  slug?: string          // NEW
  // ...
  constructor(productOptionValue?: ProductOptionValue) {
    // ...
    this.id = productOptionValue.id
    this.name = productOptionValue.name
    this.slug = productOptionValue.slug   // NEW
    // ...
  }
}
```

Because `options` is Json, existing orders simply have no `slug` key. The tracking code must treat that as "fall back to deriving from `name`", never as an error.

### 3. Nothing else

No change to `Order`, no change to the `Product` model, no new tables. If the implementation starts wanting one, stop and ask — it means the design drifted.

## The URL contract

Applies to the confirmation URL only: `/branch/<branch>/orderMode/order-finished`.

| Parameter | Meaning | Example |
| --- | --- | --- |
| `prod<p>` | Product slug. `p` = 0-based product index | `prod0=laser_testbeurt` |
| `opt<p>_<o>` | Option slug for product `p`, option `o` (0-based) | `opt0_0=zone` |
| `val<p>_<o>` | Value slug(s) for that option, multiple joined by `.` | `val0_0=bikini.oksels` |
| `sel<p>` | Flat match key for product `p` | `sel0=laser_testbeurt~zone-bikini~zone-oksels` |
| `oid` | Order id. Unchanged, already in use | `oid=93d86f70-...` |

### Why `sel` exists next to the indexed parameters

The indexed parameters are the data model. `sel` is a derived, position-independent match key, and it exists because **Meta custom conversions can only do plain substring matching**. Matching "laser, zone bikini" on the indexed parameters needs three AND-ed conditions, all anchored to the index `_0`. Add an option that sorts before `zone` and the zone moves to `opt0_1`, the rule silently matches nothing, and nobody notices for weeks.

With `sel`, the Meta rule is one condition on `zone-bikini`, stable no matter how many options are added.

`sel` is never a second source of truth — it is always generated from the same data in the same pass.

### Rules

1. **Ordering is deterministic.** Sort options by option slug (ascending), and values within an option by value slug. Not by `idx` — reordering in the admin would shift the indices and break Meta rules.
2. **Limits.** At most 3 products, 3 options per product, 5 values per option. Truncate silently beyond that; the full data is in the dataLayer event anyway. `sel<p>` is capped at 200 characters.
3. **Omit what is empty.** A product with no options emits `prod<p>` and `sel<p>` only. Never emit an empty parameter.
4. **`sel<p>` is always emitted** when `prod<p>` is, even with no options. Consistent behaviour is easier to test than a conditional.
5. **Character set.** Slugs are `[a-z0-9_]` only. `.` joins values, `~` and `-` build `sel`. All are unreserved in RFC 3986, so nothing gets percent-encoded on the way.
6. **Never `:` or `=` inside a value.** `auth.service.ts` re-parses the query string with `pair.split('=')` and destructures two elements; a second `=` in a value loses everything after it on the post-login redirect. That path already cost us the `%253F` bug in September.

### Worked examples

One product, no options:

```
?prod0=wellness&sel0=wellness&oid=93d86f70-0dbd-4a23-a892-f5d0a924bcd8
```

One product, one option, one value:

```
?prod0=laser_testbeurt&opt0_0=zone&val0_0=bikini
&sel0=laser_testbeurt~zone-bikini&oid=93d86f70-...
```

One product, one option, two values (multiSelect — the normal laser case):

```
?prod0=laser_testbeurt&opt0_0=zone&val0_0=bikini.oksels
&sel0=laser_testbeurt~zone-bikini~zone-oksels&oid=93d86f70-...
```

Two products, second has no options:

```
?prod0=laser_testbeurt&opt0_0=zone&val0_0=oksels&sel0=laser_testbeurt~zone-oksels
&prod1=wellness&sel1=wellness&oid=93d86f70-...
```

Two options on one product:

```
?prod0=cerelift_pro&opt0_0=6extra&val0_0=ja&opt0_1=zone&val0_1=gelaat
&sel0=cerelift_pro~6extra-ja~zone-gelaat&oid=93d86f70-...
```

(Note the ordering: `6extra` sorts before `zone`.)

## Slug rules

One function, used for every slug in this spec. Prefer the stored slug; derive only as a fallback.

```ts
/** Resolution order: stored slug -> derived from name -> undefined */
export function trackingSlug(stored?: string, name?: string): string | undefined {
  const raw = stored?.trim() || name?.trim()
  if (!raw) return undefined
  return slugify(raw) || undefined
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')                  // split accents off
    .replace(/[̀-ͯ]/g, '')   // drop them: knieën -> knieen
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')       // everything else becomes _
    .replace(/_+/g, '_')               // collapse runs
    .replace(/^_|_$/g, '')             // trim
    .slice(0, 40)
}
```

Expected output for the real zone values:

| `ProductOptionValue.name` | Derived slug |
| --- | --- |
| Bovenlip | `bovenlip` |
| Wenkbrauwen (neusbrug) | `wenkbrauwen_neusbrug` |
| Gelaat | `gelaat` |
| Bovenarmen tot oksels | `bovenarmen_tot_oksels` |
| Onderbenen incl. kniën | `onderbenen_incl_knieen` |
| Volledige benen | `volledige_benen` |

**Fill in `slug` explicitly for every value that an ad will ever target.** The derived slug is a safety net, not the plan — the whole reason for adding the column is that a rename must not change the slug. For the zones we will advertise, short and stable beats descriptive: `oksels`, `bikini`, `gelaat`, `onderbenen`, `volledige_benen`.

The same function handles `Product.slug` and `ProductOption.slug`, both of which already exist and are already snakecased today via `sc.snakecase` in `TrackingService`. Replacing that with `slugify` is fine and makes the behaviour uniform, but check that no existing product slug changes value — if one does, the Meta conversion rule for it has to be updated in the same release.

## Where this goes in the code

| File | Change |
| --- | --- |
| `altea-api/prisma/schema.prisma` | `slug String?` on `ProductOptionValue` + migration + backfill |
| `ts-altea-model/.../schema/product.ts` | `slug?: string` on the `ProductOptionValue` class |
| `ts-altea-model/.../schema/order-line.ts` | `slug?: string` on `OrderLineOption` and `OrderLineOptionValue`, assigned in both constructors |
| `altea-pub-app2/.../tracking/tracking.service.ts` | All new logic lives here |
| `altea-pub-app2/.../branch/order/order.component.ts` | Call site in `gotoMode()` |
| `altea-pub-app2/.../branch/pay-online/pay-online.component.ts` | Call site in `gotoOrderFinished()` |
| Admin UI | Expose the new slug field next to `name` in *Mogelijke keuzes* |

### The new API on `TrackingService`

```ts
export interface TrackingOption {
  slug: string
  values: string[]        // already slugified, sorted
}

export interface TrackingProduct {
  slug: string
  options: TrackingOption[]   // sorted by slug
}

/** Reads the order, resolves every slug, applies limits and sorting. */
trackingProducts(order?: Order): TrackingProduct[]

/** Builds sel<p> for one product. */
selKey(product: TrackingProduct): string

/** The complete query params object for the confirmation URL. */
trackingQueryParams(order?: Order): Record<string, string>
```

`trackingQueryParams` is what the call sites use. It returns `prod<p>`, `opt<p>_<o>`, `val<p>_<o>`, `sel<p>` and `oid`, already limited and sorted — nothing else builds URL parameters.

```ts
trackingQueryParams(order?: Order): Record<string, string> {
  const params: Record<string, string> = {}
  if (!order) return params
  if (order.id) params['oid'] = order.id

  this.trackingProducts(order).forEach((prod, p) => {
    params[`prod${p}`] = prod.slug
    params[`sel${p}`] = this.selKey(prod).slice(0, 200)
    prod.options.forEach((opt, o) => {
      params[`opt${p}_${o}`] = opt.slug
      params[`val${p}_${o}`] = opt.values.join('.')
    })
  })
  return params
}

selKey(prod: TrackingProduct): string {
  const parts = [prod.slug]
  prod.options.forEach(opt =>
    opt.values.forEach(v => parts.push(`${opt.slug}-${v}`))
  )
  return parts.join('~')
}
```

### The call sites get shorter

`order.component.ts`, in `gotoMode()`, replaces the hand-built `prod0` / `oid` block with one line:

```ts
if (mode == 'order-finished')
  extras['queryParams'] = this.trackingSvc.trackingQueryParams(this.orderMgrSvc.order)

await this.router.navigate(['/branch', branchUnique, 'orderMode', mode], extras)

if (mode == 'order-finished')
  this.trackingSvc.bookingConfirmed(this.orderMgrSvc.order)
```

Same in `pay-online.component.ts`'s `gotoOrderFinished()`. **Keep the existing order**: navigate first, fire the event after, so the event carries the confirmation URL rather than the previous page's.

### Non-negotiable

Everything in `TrackingService` stays wrapped in try/catch and returns empty on failure, exactly as it does today. A slug that cannot be resolved means one missing parameter, never a booking that fails to complete.

## The dataLayer contract

The URL is constrained by what Meta's conversion rules can read. The event is not, so it carries the full structure.

**Do not change `products`** — it feeds `content_ids` on the live Meta pixel tag and must stay an array of product slugs. Add new fields beside it:

```js
window.dataLayer.push({
  event: 'booking_confirmed',
  eventId: '93d86f70-0dbd-4a23-a892-f5d0a924bcd8',
  orderId: '93d86f70-0dbd-4a23-a892-f5d0a924bcd8',
  value: 0,
  paidValue: 0,
  paidOnline: false,
  currency: 'EUR',
  productMain: 'laser_testbeurt',
  products: ['laser_testbeurt'],          // unchanged

  // NEW
  productOptions: [                       // same index as products
    { slug: 'laser_testbeurt',
      options: { zone: ['bikini', 'oksels'] } }
  ],
  sel: ['laser_testbeurt~zone-bikini~zone-oksels'],   // same index as products
  selMain: 'laser_testbeurt~zone-bikini~zone-oksels', // = sel[0], for convenience

  branch: '66e77bdb-a5f5-4d3d-99e0-4391bded4c6c'
})
```

`productOptions` and `sel` are index-aligned with `products`. Where a product has no options, `productOptions[i].options` is `{}` and `sel[i]` is just the product slug.

### GTM (container GTM-T6BRL2DH)

Two new Data Layer Variables, alongside the eight that exist:

| Variable name | Data layer variable name |
| --- | --- |
| `selMain` | `selMain` |
| `productOptions` | `productOptions` |

Nothing about the existing "Booking event" tag changes — `value`, `currency`, `content_ids`, `content_name` and Event ID all keep working. `selMain` is there for the GA4 tag and for debugging in Tag Assistant; the Meta conversions read the URL, not the event.

Add `selMain` as a parameter on the GA4 event tag once that tag exists.

## Tests

### Unit tests — `tracking.service.spec.ts`

```ts
describe('slugify', () => {
  it('lowercases and replaces separators', () => {
    expect(slugify('Bovenlip')).toBe('bovenlip')
    expect(slugify('Volledige benen')).toBe('volledige_benen')
  })
  it('strips punctuation and collapses runs', () => {
    expect(slugify('Wenkbrauwen (neusbrug)')).toBe('wenkbrauwen_neusbrug')
  })
  it('removes accents', () => {
    expect(slugify('Onderbenen incl. kniën')).toBe('onderbenen_incl_knieen')
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
  })
})

describe('trackingQueryParams', () => {
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
      { slug: 'laser_testbeurt',
        options: [{ slug: 'zone', values: ['oksels', 'bikini'] }] }
    ])
    const p = svc.trackingQueryParams(order)
    expect(p['val0_0']).toBe('bikini.oksels')
    expect(p['sel0']).toBe('laser_testbeurt~zone-bikini~zone-oksels')
  })

  it('sorts options by slug, not by input order', () => {
    const order = makeOrder([
      { slug: 'cerelift_pro', options: [
        { slug: 'zone', values: ['gelaat'] },
        { slug: '6extra', values: ['ja'] }
      ] }
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

  it('applies the limits', () => {
    const order = makeOrder([{ slug: 'x', options: [
      { slug: 'a', values: ['1'] }, { slug: 'b', values: ['1'] },
      { slug: 'c', values: ['1'] }, { slug: 'd', values: ['1'] }
    ] }])
    const p = svc.trackingQueryParams(order)
    expect(p['opt0_3']).toBeUndefined()
    expect(p['sel0'].length).toBeLessThanOrEqual(200)
  })

  it('never emits an empty parameter', () => {
    const order = makeOrder([{ slug: 'x', options: [{ slug: 'zone', values: [] }] }])
    const p = svc.trackingQueryParams(order)
    Object.values(p).forEach(v => expect(v).not.toBe(''))
  })

  it('survives a missing order', () => {
    expect(svc.trackingQueryParams(undefined)).toEqual({})
  })
})
```

### The two regression tests that matter most

These guard the bugs that actually happened.

```ts
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

  // exactly what auth.service.ts does on a post-login redirect
  const parsed: Record<string, string> = {}
  qs.split('&').forEach(pair => {
    const [key, value] = pair.split('=')
    if (key) parsed[key] = value ? decodeURIComponent(value) : ''
  })

  expect(parsed).toEqual(params)
})
```

The second one would have caught the `laser_testbeurt:zone=oksels` proposal immediately — that format loses everything after the second `=` on the post-login path.

### Manual end-to-end tests

Run against a local build with GTM Preview open. Book far in the future and cancel the orders afterwards.

| # | What you do | Expected URL fragment | Expected event |
| --- | --- | --- | --- |
| 1 | Laser testbeurt, zone = Oksels | `prod0=laser_testbeurt&opt0_0=zone&val0_0=oksels&sel0=laser_testbeurt~zone-oksels` | one `booking_confirmed`, `selMain` filled |
| 2 | Laser testbeurt, zone = Oksels **and** Bikini | `val0_0=bikini.oksels`, `sel0=...~zone-bikini~zone-oksels` | `productOptions[0].options.zone` has both |
| 3 | Wellness (no options) | `prod0=wellness&sel0=wellness`, no `opt`/`val` | event fires, `sel` = `['wellness']` |
| 4 | Refresh the confirmation page | URL unchanged | **no second event** (localStorage dedup) |
| 5 | Log in first, then book | URL intact after the post-login redirect | event fires once |
| 6 | Pay with Stripe test card | same params on `pay-finished` → `order-finished` | `paidOnline: true` |
| 7 | €0 "Confirmeren" path | params present | event fires |
| 8 | `delete window.dataLayer` before finishing | booking still completes | no error in console |

**Test 5 is the one to not skip.** It is the exact path that broke in September and the reason this spec forbids `=` and `:` inside values.

### Definition of done

- [ ] All unit tests green, including both regression tests
- [ ] Manual tests 1–8 pass
- [ ] `ng build` clean, no new TypeScript errors in the changed files
- [ ] GTM Preview shows `selMain` and `productOptions` resolving, not `undefined`
- [ ] Meta Events Manager receives `Schedule` with a value after a real booking
- [ ] Existing conversion `BOOK – laser testbeurt` (`prod0=laser_testbeurt`) still counts

## Backwards compatibility, scope, and what this unlocks

### Nothing existing breaks

`prod0` keeps its current meaning and format, so the live conversion `BOOK – laser testbeurt` (rule: URL contains `prod0=laser_testbeurt`, ID 1814556119735214) keeps counting through the change. Same for the five other `BOOK – …` conversions. The new parameters are purely additive.

Inbound marketing links (`/open/cerelift-pro?6extra=1`) are untouched. Orders created before this ships have no `slug` in their Json options and fall back to the derived slug, which is correct behaviour rather than a migration problem.

### Out of scope

- The inbound `/open/` URL format — not changed, not extended
- The Conversions API (phase 2). It will consume `productOptions` from the same source when it is built; nothing here needs revisiting for it
- Google Ads / GA4 conversion import — blocked on GA4 being wired up, separate work
- Per-zone pricing or booking flow changes — this is measurement only

### What it unlocks, once shipped

Meta custom conversions become one clean rule each, on `sel`:

| Conversion | Rule |
| --- | --- |
| `BOOK – laser testbeurt` (total) | URL contains `prod0=laser_testbeurt` |
| `BOOK – laser oksels` | URL contains `zone-oksels` |
| `BOOK – laser bikini` | URL contains `zone-bikini` |
| `BOOK – laser gelaat` | URL contains `zone-gelaat` |

Those stay valid however many options are added later, because `sel` carries no positional index. Which is the whole point of the design.

### Rollout order

1. Migration + model changes, deployed
2. Fill in `slug` on the zone values that ads will target: `oksels`, `bikini`, `gelaat`, `onderbenen`, `volledige_benen`
3. `TrackingService` + call sites, deployed
4. Verify with manual tests 1–8 on production
5. Only then create the per-zone conversions in Events Manager — a conversion built before the parameter exists shows *"Gebeurtenis nooit ontvangen"* and is easy to mistake for a bug
