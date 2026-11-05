var k = Object.defineProperty;
var R = (t, e, s) => e in t ? k(t, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : t[e] = s;
var h = (t, e, s) => R(t, typeof e != "symbol" ? e + "" : e, s);
import { M as d, P as y, e as m, S as P } from "./chunks/MascotEngine-ZpR16gBw.js";
import { A as W, B as Z, C as J, L as Q, f as ee, n as te, t as se } from "./chunks/MascotEngine-ZpR16gBw.js";
const B = "/mascot_pack";
function A(t) {
  if (t)
    try {
      const e = new URL(t);
      return e.protocol !== "http:" && e.protocol !== "https:" && e.protocol !== "file:" ? void 0 : new URL("./", e).href;
    } catch {
      return;
    }
}
function x(t) {
  const e = A(t);
  return e ? `${e}mascot_pack` : B;
}
class U {
  constructor() {
    h(this, "activeEngines", []);
    h(this, "spawnEpoch", 0);
    h(this, "spawnAbort", null);
    h(this, "groupReady", !1);
    h(this, "isClickThrough", !1);
    h(this, "currentMode", null);
  }
  get engines() {
    return this.activeEngines;
  }
  get isReady() {
    return this.groupReady;
  }
  get count() {
    return this.activeEngines.length;
  }
  get mode() {
    return this.currentMode;
  }
  setMode(e) {
    this.currentMode = e;
  }
  findEngine(e) {
    return this.activeEngines.find((s) => s.mascotName === e);
  }
  /**
   * Fast resume: when instances already exist and match expected packs,
   * restore snapshots and resume without tearing down DOM or re-parsing XML.
   */
  async fastResume(e, s) {
    if (!(this.groupReady && this.activeEngines.length === e.length && e.every((a) => this.activeEngines.some((r) => r.mascotName === a))) || !e.every((a) => s.some((r) => r.pack === a)))
      return !1;
    this.groupReady = !1;
    try {
      await Promise.all(
        this.activeEngines.map((a) => {
          const r = s.find((n) => n.pack === a.mascotName);
          return a.prepareForRelay(r);
        })
      ), this.groupReady = !0;
      for (const a of this.activeEngines)
        a.resumeForRelay();
      return !0;
    } catch (a) {
      throw this.groupReady = !1, a;
    }
  }
  /**
   * Spawns a full group of mascots with race-condition protection and synchronized first-frame resume.
   */
  async spawn(e) {
    const { packs: s, snapshots: i = [], container: a, host: r, isClickThrough: n = !1, signal: o, onSpawned: l, onFailed: u } = e;
    this.despawn();
    const p = ++this.spawnEpoch, g = new AbortController();
    if (this.spawnAbort = g, s.length === 0) return !1;
    r && r.showPlaceholders(
      i.filter((f) => s.includes(f.pack)),
      d.getPackBaseUrl()
    );
    const b = a || (r ? r.ensureHost().container : null);
    if (!b)
      throw new Error("[MascotGroup] No container or ViewportHost available for spawn");
    this.isClickThrough = n;
    for (let f = 0; f < s.length; f++) {
      const E = s[f];
      if (p !== this.spawnEpoch || g.signal.aborted || o != null && o.aborted)
        return !1;
      const v = i.find((c) => c.pack === E), S = v && typeof v.x == "number" && typeof v.y == "number" ? v : void 0;
      try {
        const c = new d(b, E), w = () => c.destroy();
        g.signal.addEventListener("abort", w, { once: !0 }), o == null || o.addEventListener("abort", w, { once: !0 });
        try {
          await c.init({
            initialSnapshot: S,
            startPaused: !0,
            signal: g.signal,
            enablePageCoordinator: !1,
            scrollSquash: e.scrollSquash
          });
        } finally {
          g.signal.removeEventListener("abort", w), o == null || o.removeEventListener("abort", w);
        }
        if (p !== this.spawnEpoch || g.signal.aborted || o != null && o.aborted)
          return c.destroy(), !1;
        c.elRoot && (c.elRoot.style.zIndex = "2147483647", c.setClickThrough(this.isClickThrough)), l == null || l(E, !!S), this.activeEngines.push(c);
      } catch (c) {
        if (g.signal.aborted || o != null && o.aborted || p !== this.spawnEpoch)
          return !1;
        throw u == null || u(E, c), this.despawn(), c;
      }
    }
    if (p === this.spawnEpoch && !g.signal.aborted && this.activeEngines.length === s.length) {
      this.groupReady = !0, this.spawnAbort = null;
      for (const f of this.activeEngines)
        f.resumeForRelay();
      return r == null || r.clearPlaceholders(), !0;
    }
    return !1;
  }
  pauseForRelay() {
    for (const e of this.activeEngines)
      e.pauseForRelay();
  }
  resumeForRelay() {
    for (const e of this.activeEngines)
      e.resumeForRelay();
  }
  createRelaySnapshots() {
    return this.activeEngines.map((e) => e.createRelaySnapshot());
  }
  setClickThrough(e) {
    this.isClickThrough = e;
    for (const s of this.activeEngines)
      s.setClickThrough(e);
  }
  setScrollSquash(e) {
    for (const s of this.activeEngines)
      s.setScrollSquash(e);
  }
  /**
   * Set behavior on active engines in this group.
   * If `pack` is specified, only targets that pack; otherwise targets all mascots in the group.
   * Returns true if at least one mascot switched behavior successfully.
   */
  setBehavior(e, s, i) {
    const a = i ? this.activeEngines.filter((n) => n.mascotName === i) : this.activeEngines;
    let r = !1;
    for (const n of a)
      n.setBehavior(e, s) && (r = !0);
    return r;
  }
  /**
   * Force behavior on active engines in this group (ignoring surface constraints and snapping by default).
   * If `pack` is specified, only targets that pack; otherwise targets all mascots in the group.
   * Returns true if at least one mascot switched behavior successfully.
   */
  forceBehavior(e, s, i) {
    return this.setBehavior(e, { ...s, force: !0 }, i);
  }
  resetToSpawn() {
    for (let e = 0; e < this.activeEngines.length; e++)
      this.activeEngines[e].resetToSpawn(e);
  }
  handleExternalScroll(e, s = !0) {
    for (const i of this.activeEngines)
      i.handleExternalScroll(e, s);
  }
  resetScrollTracking() {
    for (const e of this.activeEngines)
      e.resetScrollTracking();
  }
  despawn() {
    var e;
    this.groupReady = !1, ++this.spawnEpoch, (e = this.spawnAbort) == null || e.abort(), this.spawnAbort = null;
    for (const s of this.activeEngines)
      s.destroy();
    this.activeEngines = [];
  }
  destroy() {
    this.despawn();
  }
}
class _ {
  constructor(e = "web-mascot-host-root") {
    h(this, "hostEl", null);
    h(this, "shadow", null);
    h(this, "viewportEl", null);
    h(this, "relayPlaceholders", []);
    h(this, "hostId");
    this.hostId = e;
  }
  /**
   * Ensures the host element and Shadow DOM structure are mounted in the document.
   * Returns the viewport container element inside the shadow root.
   */
  ensureHost() {
    if (!this.hostEl || !this.hostEl.isConnected) {
      this.hostEl && this.hostEl.parentNode && this.hostEl.parentNode.removeChild(this.hostEl), this.hostEl = document.createElement("div"), this.hostEl.id = this.hostId, this.hostEl.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;overflow:visible;transform:translateZ(0);will-change:transform;contain:layout style;";
      const i = this.hostEl.attachShadow({ mode: "open" }), a = document.createElement("style");
      a.textContent = `
        :host { all: initial; }
        .mascot-viewport {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
          transform: translateZ(0);
          will-change: transform;
          contain: layout style;
        }
        .mascot-viewport img {
          max-width: none !important;
          max-height: none !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          filter: none !important;
          user-select: none !important;
          pointer-events: auto;
        }
        .relay-placeholder {
          position: fixed;
          left: 0;
          top: 0;
          width: 0;
          height: 0;
          overflow: visible;
          pointer-events: none;
          z-index: 2147483646;
          visibility: hidden;
        }
        .relay-placeholder img {
          position: absolute;
          left: 0;
          top: 0;
          width: auto !important;
          height: auto !important;
          max-width: none !important;
          max-height: none !important;
          pointer-events: none !important;
        }
      `, i.appendChild(a);
      const r = document.createElement("div");
      r.className = "mascot-viewport", i.appendChild(r);
      const n = document.documentElement || document.body;
      n && n.appendChild(this.hostEl), this.shadow = i, this.viewportEl = r;
    }
    const e = this.shadow || this.hostEl.shadowRoot;
    return { container: this.viewportEl || e.querySelector(".mascot-viewport") || this.hostEl, shadow: e, hostEl: this.hostEl };
  }
  /**
   * Renders static bitmap placeholders for seamless cross-document handoffs.
   */
  showPlaceholders(e, s) {
    this.clearPlaceholders();
    const i = e.filter((r) => {
      var n;
      return (n = r.visual) == null ? void 0 : n.image;
    });
    if (i.length === 0) return;
    const { container: a } = this.ensureHost();
    for (const r of i) {
      const n = r.visual, o = document.createElement("div");
      o.className = "relay-placeholder", o.dataset.pack = r.pack, o.style.transform = `translate3d(${n.screenX * window.innerWidth / n.viewportWidth}px, ${n.screenY * window.innerHeight / n.viewportHeight}px, 0)`;
      const l = document.createElement("img");
      l.alt = "", l.decoding = "async", l.style.transformOrigin = "0 0";
      const u = n.lookRight ? -1 : 1;
      l.style.transform = `translate(${-u * n.imageAnchor.x * n.scale}px, ${-n.imageAnchor.y * n.scale}px) scaleX(${u * n.scale}) scaleY(${n.scale})`, l.addEventListener("load", () => {
        o.style.visibility = "visible";
      }), l.src = `${s}/${r.pack}/img${n.image}`, o.appendChild(l), a.appendChild(o), this.relayPlaceholders.push(o);
    }
    this.hostEl && (this.hostEl.style.display = "");
  }
  /**
   * Removes all current placeholder elements.
   */
  clearPlaceholders() {
    for (const e of this.relayPlaceholders) e.remove();
    this.relayPlaceholders = [];
  }
  /**
   * Shows the host container.
   */
  show() {
    this.hostEl && (this.hostEl.style.display = "");
  }
  /**
   * Hides the host container without destroying elements.
   */
  hide() {
    this.hostEl && (this.hostEl.style.display = "none");
  }
  /**
   * Destroys the host and removes it from DOM.
   */
  destroy() {
    this.clearPlaceholders(), this.hostEl && this.hostEl.parentNode && (this.hostEl.parentNode.removeChild(this.hostEl), this.hostEl = null), this.shadow = null, this.viewportEl = null;
  }
  get isMounted() {
    return !!(this.hostEl && this.hostEl.isConnected);
  }
  get element() {
    return this.hostEl;
  }
}
const M = x(import.meta.url);
d.configure({ packBaseUrl: M });
let C = !1;
function q(t) {
  C = !0, t.preset && T(t.preset), (t.assets || t.animationConfigUrl || t.ignoreBuiltin !== void 0 || t.preset) && d.configure({
    packBaseUrl: t.assets,
    animationConfigUrl: t.animationConfigUrl,
    preset: t.preset,
    ignoreBuiltin: t.ignoreBuiltin
  }), t.runtime && d.setRuntimeOptions(t.runtime);
}
function $() {
  return C;
}
function F() {
  return d.getPackBaseUrl();
}
function O() {
  return d.getRuntimeOptions();
}
class N {
  /** Use `createMascot()` instead of constructing this directly. */
  constructor(e) {
    /** The engine instance, exposed for the browser console and for hosts that
     *  need the simulation state (`snapshot()`, `position()`). */
    h(this, "engine");
    h(this, "destroyed", !1);
    this.engine = e;
  }
  /** Stable identity, also used to name this mascot's log file in dev builds. */
  get label() {
    return this.engine.label;
  }
  setClickThrough(e) {
    this.engine.setClickThrough(e);
  }
  setScrollSquash(e) {
    this.engine.setScrollSquash(e);
  }
  getScrollSquash() {
    return this.engine.getScrollSquash();
  }
  /** Name of the behavior currently running, or null if none. */
  get currentBehavior() {
    return this.engine.currentBehaviorName;
  }
  /** Name of the behavior currently running, or null if none. */
  getCurrentBehavior() {
    return this.engine.currentBehaviorName;
  }
  /**
   * Get list of all distinct behaviors with surface requirements and immediate availability.
   */
  getBehaviors() {
    return this.engine.getBehaviors();
  }
  /**
   * Check whether a behavior or action can immediately execute on the mascot's current surface.
   */
  canExecuteBehavior(e) {
    return this.engine.canExecuteBehavior(e);
  }
  /**
   * Switch the mascot to a target behavior or action.
   * If surface constraints are not met, returns false unless `options.force` is true.
   */
  setBehavior(e, s) {
    return this.engine.setBehavior(e, s);
  }
  /**
   * Force the mascot to switch to a target behavior, bypassing surface constraints
   * and automatically snapping to the required surface by default.
   */
  forceBehavior(e, s) {
    return this.engine.forceBehavior(e, s);
  }
  /** Remove the mascot from the page. Safe to call more than once. */
  destroy() {
    this.destroyed || (this.destroyed = !0, this.engine.destroy());
  }
}
async function H(t) {
  const { container: e, pack: s, initialSnapshot: i, startPaused: a, signal: r, enablePageCoordinator: n, scrollSquash: o } = t;
  if (!e) throw new Error("[web-mascot] createMascot() needs a container element");
  if (!s) throw new Error("[web-mascot] createMascot() needs a pack name");
  const l = new d(e, s), u = () => l.destroy();
  r == null || r.addEventListener("abort", u, { once: !0 });
  try {
    r == null || r.throwIfAborted(), await l.init({ initialSnapshot: i, startPaused: a, signal: r, enablePageCoordinator: n, scrollSquash: o }), r == null || r.throwIfAborted();
  } catch (p) {
    throw l.destroy(), p;
  } finally {
    r == null || r.removeEventListener("abort", u);
  }
  return new N(l);
}
async function z(t, e) {
  const s = await P.analyze(t, e);
  m.register(s);
  const i = s.name;
  return {
    name: i,
    warnings: s.warnings,
    data: s,
    unregister: () => m.unregister(i),
    toString() {
      return i;
    },
    valueOf() {
      return i;
    }
  };
}
function D(t) {
  m.register(t);
}
function G(t) {
  return m.unregister(t);
}
function K(t) {
  return m.has(t);
}
function V(t) {
  return y.get(t);
}
function X(t, e) {
  y.register(t, e);
}
function T(t) {
  y.setDefaultPresetName(t), d.setPreset(t);
}
export {
  W as AnimationConfig,
  Z as BroadcastManager,
  J as CLASSIC_ANIMATION_PRESET,
  B as DEFAULT_PACK_BASE_URL,
  Q as LIVELY_ANIMATION_PRESET,
  N as Mascot,
  d as MascotEngine,
  U as MascotGroup,
  M as PACK_BASE_URL,
  m as PackRegistry,
  y as PresetRegistry,
  ee as STANDARD_CONFIG_SAMPLE,
  P as ShimejiFinder,
  _ as ViewportHost,
  F as assetBaseUrl,
  q as configure,
  H as createMascot,
  V as getPreset,
  K as hasMascotPack,
  z as importMascotPack,
  $ as isConfigured,
  te as normalizeSpriteKey,
  D as registerMascotPack,
  X as registerPreset,
  A as resolveAssetBase,
  O as runtimeOptions,
  se as translateShimejiXml,
  G as unregisterMascotPack,
  T as usePreset
};
//# sourceMappingURL=index.js.map
