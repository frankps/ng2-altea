/**
 * Keyboard-wedge barcode scan (Zebra DS2278 and the same idea as the Phuket till).
 *
 * The scanner types the code very fast and then sends Enter. A finger on a
 * quantity is slower, so those digits stay in the field. A fast run of digits
 * is the code: it is taken out of whatever was focused and looked up.
 */

/** Quiet gap after the last scanner character. */
export const SCAN_SETTLE_MS = 150

/**
 * Gap that still belongs to one wedge burst. A finger on a quantity is slower,
 * so those digits stay in the field.
 */
export const SCAN_KEY_GAP_MS = 70

/** Scanner-shaped: no spaces, a digit, long enough that a name is unlikely. */
export function looksLikeBarcode(term: string): boolean {
  const value = (term ?? '').trim()
  return value.length >= 6 && /\d/.test(value) && !/\s/.test(value)
}

/**
 * The code to look up from the search box.
 * A pure code is used as typed. A long digit run stuck after a name
 * (the box still held the previous search) is the code.
 * A short letter prefix stays part of the code, so `AB12345678` is kept whole.
 */
export function barcodeFromSearch(term: string): string | null {
  const value = (term ?? '').trim()
  if (!value || /\s/.test(value))
    return null
  if (/^\d{6,}$/.test(value))
    return value
  const tail = value.match(/^(.+?)(\d{8,})$/)
  if (tail && tail[1].length >= 4 && /[a-z]/i.test(tail[1]))
    return tail[2]
  if (looksLikeBarcode(value))
    return value
  return null
}

export function focusProductSearch(): void {
  const el = document.getElementById('search-options')
  if (!(el instanceof HTMLInputElement))
    return
  el.focus()
  el.select()
}

export function scanCommitKey(key: string): boolean {
  return key === 'Enter' || key === 'NumpadEnter' || key === 'Tab'
}

/** A scanner is still sending the code. Digits only: letters stay in the field. */
export function scanBuffer(term: string): boolean {
  const value = (term ?? '').trim()
  if (!value || /\s/.test(value))
    return false
  return /^\d+$/.test(value)
}

/**
 * What a quiet burst does. One digit already landed in the field. A short run
 * is written there as the new value. A code stays out of that field.
 */
export function burstQuiet(buffer: string): 'leave' | 'release' | 'drop' {
  if (buffer.length < 2)
    return 'leave'
  if (looksLikeBarcode(buffer))
    return 'drop'
  return 'release'
}

export function burstWaitMs(length: number): number {
  return length >= 2 ? SCAN_SETTLE_MS : SCAN_KEY_GAP_MS
}

/**
 * One digit aimed at something other than the search field.
 * The first digit is left for that field. A second digit inside the wedge gap
 * is a scanner: take it, and put the field back to the value it had.
 */
export function nextScanDigit(
  buffer: string,
  gapMs: number,
  digit: string,
): { take: boolean; restore: boolean; buffer: string } {
  const continues = buffer.length > 0 && gapMs <= SCAN_KEY_GAP_MS
  if (!continues)
    return { take: false, restore: false, buffer: digit }
  return { take: true, restore: buffer.length === 1, buffer: buffer + digit }
}

/**
 * A SKU the till grid does not list can still answer a scan (same rule as
 * Phuket): a variant child, or a row that is orderable / visible in POS.
 * `pos` is the v2 channel. Older rows only have `showPos`.
 */
export function posScanAllowed(product: {
  variantOfId?: string | null
  pos?: string | null
  showPos?: boolean
}): boolean {
  if (product.variantOfId)
    return true
  const pos = product.pos
  if (pos === 'invisible')
    return false
  if (pos === 'orderable' || pos === 'reserve' || pos === 'visible')
    return true
  return product.showPos !== false
}

export function setInputValue(el: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setter)
    return
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

const SEARCH_FIELD_ID = 'search-options'

/**
 * Listens in the capture phase. The search box is left alone: Enter there
 * is the normal search, which also understands a barcode.
 */
export class BarcodeWedge {
  private chars = ''
  private lastAt = 0
  private origin: HTMLInputElement | null = null
  private previous: string | null = null
  private timer = 0
  private swallowUntil = 0

  constructor(private readonly onScan: (code: string) => void) { }

  handle(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing)
      return

    const target = event.target
    if (target instanceof Element && target.closest(`#${SEARCH_FIELD_ID}`))
      return

    if (scanCommitKey(event.key)) {
      if (performance.now() < this.swallowUntil) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (!looksLikeBarcode(this.chars))
        return
      event.preventDefault()
      event.stopPropagation()
      const term = this.chars
      if (this.origin && this.previous !== null)
        setInputValue(this.origin, this.previous)
      this.drop()
      this.swallowUntil = performance.now() + 300
      this.onScan(term)
      return
    }

    if (event.key.length !== 1 || !/^\d$/.test(event.key)) {
      if (this.chars && burstQuiet(this.chars) === 'release' && this.origin)
        setInputValue(this.origin, this.chars)
      this.drop()
      return
    }

    const now = performance.now()
    const gap = this.chars ? now - this.lastAt : Number.POSITIVE_INFINITY
    const step = nextScanDigit(this.chars, gap, event.key)
    if (!step.take) {
      if (burstQuiet(this.chars) === 'release' && this.origin)
        setInputValue(this.origin, this.chars)
      this.chars = step.buffer
      this.lastAt = now
      this.origin = target instanceof HTMLInputElement ? target : null
      this.previous = this.origin ? this.origin.value : null
      window.clearTimeout(this.timer)
      this.timer = window.setTimeout(() => {
        if (this.chars.length < 2)
          this.drop()
      }, burstWaitMs(1))
      return
    }

    event.preventDefault()
    event.stopPropagation()
    if (step.restore && this.origin && this.previous !== null)
      setInputValue(this.origin, this.previous)
    this.chars = step.buffer
    this.lastAt = now
    window.clearTimeout(this.timer)
    const snapshot = this.chars
    this.timer = window.setTimeout(() => {
      if (this.chars !== snapshot)
        return
      const quiet = burstQuiet(snapshot)
      if (quiet === 'release' && this.origin)
        setInputValue(this.origin, snapshot)
      const code = quiet === 'drop' && looksLikeBarcode(snapshot) ? snapshot : ''
      this.drop()
      if (!code)
        return
      this.swallowUntil = performance.now() + 300
      this.onScan(code)
    }, burstWaitMs(this.chars.length))
  }

  reset(): void {
    this.drop()
  }

  dispose(): void {
    this.drop()
  }

  private drop(): void {
    this.chars = ''
    this.lastAt = 0
    this.origin = null
    this.previous = null
    window.clearTimeout(this.timer)
    this.timer = 0
  }
}
