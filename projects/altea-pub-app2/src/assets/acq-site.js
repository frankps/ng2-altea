/*! acq-site.js v1 — acquisition hand-off from a tenant website to the booking app.
 *
 * Phuket acquisition-capture-spec rev 0.2, ACQ-26. Hosted by the platform, used by every tenant:
 *
 *   <script src="https://book.birdy.life/assets/acq-site.js" defer></script>
 *
 * Optional attribute: data-booking-hosts="book.birdy.life,other.host" (default: book.birdy.life).
 *
 * What it does on the tenant's site (first-party storage of that site, nothing is sent anywhere):
 * 1. On every page load it records how the visitor arrived:
 *    - a TAGGED landing (any utm_*, recognised click id or ad-platform id) is kept 90 days in localStorage
 *      (`last` replaced by every new tagged landing, `first` kept); an untagged visit never overwrites it;
 *    - the first page of the tab (instant, landing, external referrer host) goes to sessionStorage.
 * 2. Every link to the booking app (and every booking iframe) gets that information appended:
 *    the original utm_* / click ids / platform ids, plus acq_land (host + path of the landing page),
 *    acq_ref (original referrer host) and acq_at (ISO instant of the landing). Parameters already on
 *    the link are never overwritten. The booking app stores them in Order.attr.
 *
 * Keep ACQ_CLICK_IDS / ACQ_PLATFORM_IDS in sync with ts-altea-model lib/marketing/acquisition.ts.
 * Never throws: a tracking problem must never break a page or a booking link.
 */
(function () {
  'use strict'

  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__acqSite)
    return

  var VERSION = 1
  var CLICK_IDS = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'dclid', 'msclkid', 'ttclid', 'li_fat_id', 'epik', 'ScCid', 'twclid', 'rdt_cid']
  var PLATFORM_IDS = ['adset_id', 'ad_id', 'adgroupid', 'creative']
  var HORIZON_MS = 90 * 24 * 60 * 60 * 1000
  var SKEW_MS = 5 * 60 * 1000
  var STORE_KEY = 'acq.site.v1'
  var VISIT_KEY = 'acq.site.visit'
  var MAX = 256

  var script = document.currentScript
  var hosts = ((script && script.getAttribute('data-booking-hosts')) || 'book.birdy.life')
    .split(',').map(function (h) { return h.trim().toLowerCase() }).filter(Boolean)

  function cap(value, max) {
    if (typeof value !== 'string') return undefined
    value = value.trim()
    return value ? value.slice(0, max || MAX) : undefined
  }

  function bare(host) { return (host || '').toLowerCase().replace(/^www\./, '') }

  function hostOf(url) {
    try { return url ? cap(new URL(url).host, 253) : undefined } catch (e) { return undefined }
  }

  function readJson(storage, key) {
    try { var raw = storage.getItem(key); return raw ? JSON.parse(raw) : undefined } catch (e) { return undefined }
  }

  function writeJson(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)) } catch (e) { /* storage blocked */ }
  }

  function fresh(touch, now) {
    if (!touch || !touch.at) return false
    var t = Date.parse(touch.at)
    return !isNaN(t) && t <= now + SKEW_MS && now - t <= HORIZON_MS
  }

  function compact(obj) {
    Object.keys(obj).forEach(function (k) { if (obj[k] === undefined) delete obj[k] })
    return obj
  }

  function isTracked(key) {
    return key.indexOf('utm_') === 0 || CLICK_IDS.indexOf(key) >= 0 || PLATFORM_IDS.indexOf(key) >= 0
  }

  /** 1. record how the visitor arrived on this site */
  function capture() {
    try {
      var now = Date.now()
      var at = new Date(now).toISOString()
      var land = cap(location.host + location.pathname)
      var refHost = hostOf(document.referrer)
      var ref = refHost && bare(refHost) !== bare(location.host) ? refHost : undefined   // own pages are not a referrer

      if (!readJson(sessionStorage, VISIT_KEY))
        writeJson(sessionStorage, VISIT_KEY, compact({ at: at, land: land, ref: ref }))

      var params = {}
      var count = 0
      new URLSearchParams(location.search).forEach(function (value, key) {
        if (count >= 32 || !isTracked(key) || params.hasOwnProperty(key)) return
        var v = cap(value)
        if (v) { params[key] = v; count++ }
      })

      if (!count) return   // not tagged: never overwrite a stored touch

      var store = readJson(localStorage, STORE_KEY) || {}
      var first = fresh(store.first, now) ? store.first : undefined
      var last = fresh(store.last, now) ? store.last : undefined

      // a reload of the same landing must not move `last` forward
      if (last && last.land === land && JSON.stringify(last.params) === JSON.stringify(params)) return

      var touch = compact({ at: at, params: params, land: land, ref: ref })
      writeJson(localStorage, STORE_KEY, { first: first || touch, last: touch })
    } catch (e) { /* never break the page */ }
  }

  /** 2. append the stored information to a booking URL */
  function decorate(href) {
    try {
      if (!href) return href
      var url = new URL(href, location.href)
      if (hosts.indexOf(url.host.toLowerCase()) < 0) return href

      var now = Date.now()
      var store = readJson(localStorage, STORE_KEY) || {}
      var last = fresh(store.last, now) ? store.last : undefined
      var visit = readJson(sessionStorage, VISIT_KEY)
      var source = last || visit
      if (!source) return href

      var set = function (key, value) {
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value)
      }

      if (last && last.params)
        Object.keys(last.params).forEach(function (key) { set(key, last.params[key]) })

      set('acq_land', source.land)
      set('acq_ref', source.ref)
      set('acq_at', source.at)

      return url.toString()
    } catch (e) {
      return href
    }
  }

  function decorateAnchor(a) {
    try {
      var href = a.getAttribute('href')
      if (!href) return
      var next = decorate(a.href)
      if (next && next !== a.href) a.setAttribute('href', next)
    } catch (e) { /* ignore */ }
  }

  function decorateFrame(f) {
    try {
      if (f.getAttribute('data-acq')) return   // once: changing src later reloads the frame
      var next = decorate(f.src)
      f.setAttribute('data-acq', '1')
      if (next && next !== f.src) f.setAttribute('src', next)
    } catch (e) { /* ignore */ }
  }

  function decorateAll() {
    try {
      var anchors = document.querySelectorAll('a[href]')
      for (var i = 0; i < anchors.length; i++) decorateAnchor(anchors[i])
      var frames = document.querySelectorAll('iframe[src]')
      for (var j = 0; j < frames.length; j++) decorateFrame(frames[j])
    } catch (e) { /* ignore */ }
  }

  /** decorate right before the link is used: click, middle click, long press, context menu */
  function onPointer(event) {
    try {
      var el = event.target && event.target.closest ? event.target.closest('a[href]') : null
      if (el) decorateAnchor(el)
    } catch (e) { /* ignore */ }
  }

  capture()

  // capture phase: runs before the site's own click handlers (e.g. Framer overrides), so they see the decorated href
  ;['click', 'auxclick', 'contextmenu', 'mousedown', 'touchstart', 'keydown'].forEach(function (type) {
    document.addEventListener(type, onPointer, { capture: true, passive: true })
  })

  // pages built by client-side frameworks (Framer, React) add links after load
  var pending = false
  function schedule() {
    if (pending) return
    pending = true
    setTimeout(function () { pending = false; decorateAll() }, 200)
  }

  function start() {
    decorateAll()
    try {
      if (window.MutationObserver)
        new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true })
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()

  // client-side navigation inside the site: re-run capture for the new URL
  try {
    var push = history.pushState
    history.pushState = function () {
      var r = push.apply(this, arguments)
      capture(); schedule()
      return r
    }
    window.addEventListener('popstate', function () { capture(); schedule() })
  } catch (e) { /* ignore */ }

  window.__acqSite = { version: VERSION, decorate: decorate, capture: capture, hosts: hosts }
})()
