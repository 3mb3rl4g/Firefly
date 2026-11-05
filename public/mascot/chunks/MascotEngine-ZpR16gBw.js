var Yt = Object.defineProperty;
var Ht = (r, e, t) => e in r ? Yt(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var m = (r, e, t) => Ht(r, typeof e != "symbol" ? e + "" : e, t);
const Ut = {
  // Elements
  動作リスト: "ActionList",
  動作: "Action",
  動作参照: "ActionReference",
  ポーズ: "Pose",
  行動リスト: "BehaviorList",
  行動: "Behavior",
  次の行動リスト: "NextBehaviorList",
  行動参照: "BehaviorReference",
  マスコット: "Mascot",
  アニメーション: "Animation",
  条件: "Condition",
  // Attributes
  名前: "Name",
  値: "Value",
  種類: "Type",
  クラス: "Class",
  組み込み: "Embedded",
  枠: "BorderType",
  目的地X: "TargetX",
  目的地Y: "TargetY",
  速度: "VelocityParam",
  初速X: "InitialVX",
  初速Y: "InitialVY",
  重力: "Gravity",
  空気抵抗X: "ResistanceX",
  空気抵抗Y: "ResistanceY",
  右向き: "LookRight",
  IEの端X: "IeOffsetX",
  IEの端Y: "IeOffsetY",
  生まれる場所X: "BornX",
  生まれる場所Y: "BornY",
  生まれた時の行動: "BornBehavior",
  繰り返し: "Loop",
  画像: "Image",
  基準座標: "ImageAnchor",
  移動速度: "Velocity",
  長さ: "Duration",
  頻度: "Frequency",
  定数: "Constant",
  追加: "Add",
  端X: "OffsetX",
  端Y: "OffsetY",
  // Common Action & Behavior types / values
  静止: "Stay",
  固定: "Animate",
  移動: "Move",
  複合: "Sequence",
  選択: "Select",
  天井: "Ceiling",
  壁: "Wall",
  地面: "Floor",
  落下する: "Fall",
  ドラッグされる: "Dragged",
  投げられる: "Thrown",
  マウスの周りに集まる: "ChaseMouse"
};
function he(r) {
  if (!r) return "";
  let e = r.replace(/^\uFEFF/, "");
  if (!/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(e))
    return e;
  for (const [t, i] of Object.entries(Ut))
    e = e.replace(new RegExp(`(<|</)${t}([\\s>/])`, "g"), `$1${i}$2`), e = e.replace(new RegExp(`(\\s)${t}=`, "g"), `$1${i}=`), e = e.replace(new RegExp(`=(["'])${t}\\1`, "g"), `=$1${i}$1`);
  return e;
}
class it {
  /**
   * Parse configuration directly from raw XML strings.
   * Useful for in-memory packs, ZIP archives, or custom dynamic configurations.
   */
  static parseRawConfig(e, t, i) {
    if (e.trim().toLowerCase().startsWith("<!doctype html>") || t.trim().toLowerCase().startsWith("<!doctype html>"))
      throw new Error(
        `[XMLParser] 加载 ${i} 的配置失败：收到了 HTML 响应而不是 XML。`
      );
    const n = he(e), o = he(t), s = n.replace(/xmlns=".*?"/g, ""), a = o.replace(/xmlns=".*?"/g, ""), c = new DOMParser(), u = c.parseFromString(s, "text/xml"), h = c.parseFromString(a, "text/xml");
    if (u.getElementsByTagName("parsererror").length > 0)
      throw new Error(`配置 XML 无法解析: ${i}/actions.xml。`);
    if (h.getElementsByTagName("parsererror").length > 0)
      throw new Error(`配置 XML 无法解析: ${i}/behaviors.xml。`);
    return {
      actions: this.parseActions(u),
      behaviors: this.parseBehaviors(h)
    };
  }
  /**
   * @param packBaseUrl Already-resolved base URL of the pack directory, without a
   *   trailing slash (e.g. `https://cdn.example.com/mascots/Neuron`). The caller
   *   owns URL resolution, so an embedded or hosted build never depends on the
   *   page's root path.
   */
  static async loadConfig(e, t, i) {
    const n = t.replace(/\/+$/, ""), o = [
      { actions: "actions.xml", behaviors: "behaviors.xml" },
      { actions: "conf/actions.xml", behaviors: "conf/behaviors.xml" },
      { actions: "conf/動作.xml", behaviors: "conf/行動.xml" },
      { actions: "動作.xml", behaviors: "行動.xml" }
    ];
    let s = null;
    for (const a of o)
      try {
        const [c, u] = await Promise.all([
          fetch(`${n}/${a.actions}`, { signal: i }),
          fetch(`${n}/${a.behaviors}`, { signal: i })
        ]);
        if (c.ok && u.ok) {
          const h = await c.text(), l = await u.text();
          if (!h.trim().toLowerCase().startsWith("<!doctype html>") && !l.trim().toLowerCase().startsWith("<!doctype html>"))
            return this.parseRawConfig(h, l, e);
        }
      } catch (c) {
        if (i != null && i.aborted) throw c;
        s = c instanceof Error ? c : new Error(String(c));
      }
    throw new Error(`加载配置失败: ${e}.${s ? " " + s.message : ""}`);
  }
  static getTag(e, t) {
    const i = e.getElementsByTagNameNS("*", t);
    return i && i.length > 0 ? Array.from(i) : Array.from(e.getElementsByTagName(t));
  }
  static parseActions(e) {
    const t = {}, i = this.getTag(e, "ActionList");
    for (const n of i)
      for (let o = 0; o < n.children.length; o++) {
        const s = n.children[o], a = s.localName || s.tagName;
        if (a === "Action" || a.endsWith(":Action")) {
          const c = this.parseActionNode(s);
          c.name && (t[c.name] = c);
        }
      }
    return t;
  }
  static parseActionNode(e) {
    var o;
    const t = e.localName || e.tagName;
    if (t === "ActionReference" || t.endsWith(":ActionReference")) {
      const s = {};
      for (let a = 0; a < e.attributes.length; a++) {
        const c = e.attributes.item(a);
        c && (s[c.name] = c.value);
      }
      return {
        type: "ActionReference",
        referenceName: e.getAttribute("Name") || "",
        condition: e.getAttribute("Condition") || void 0,
        duration: e.getAttribute("Duration") || void 0,
        initialVX: e.getAttribute("InitialVX") || void 0,
        initialVY: e.getAttribute("InitialVY") || void 0,
        attributes: s
      };
    }
    const i = e.getAttribute("Type") || "Stay", n = {
      name: e.getAttribute("Name") || void 0,
      type: i,
      className: e.getAttribute("Class") || void 0,
      borderType: e.getAttribute("BorderType") || void 0,
      condition: e.getAttribute("Condition") || void 0,
      // libshijima's sequence reads "Loops"; the shipped packs write "Loop".
      loop: e.getAttribute("Loops") === "true" || e.getAttribute("Loop") === "true",
      // Embedded 物理参数
      initialVX: e.getAttribute("InitialVX") || void 0,
      initialVY: e.getAttribute("InitialVY") || void 0,
      attributes: this.readAttributes(e)
    };
    if (i === "Sequence" || i === "Select") {
      n.children = [];
      for (let s = 0; s < e.children.length; s++) {
        const a = e.children[s], c = a.localName || a.tagName;
        (c === "Action" || c === "ActionReference" || c.endsWith("Action") || c.endsWith("ActionReference")) && n.children.push(this.parseActionNode(a));
      }
    } else {
      const s = Array.from(e.children).filter(
        (a) => (a.localName || a.tagName) === "Animation"
      );
      n.animations = s.map((a) => ({
        condition: a.getAttribute("Condition") || void 0,
        poses: this.parsePoses(a),
        hotspots: this.parseHotspots(a)
      })), n.poses = ((o = n.animations[0]) == null ? void 0 : o.poses) || [];
    }
    return n;
  }
  static readAttributes(e) {
    const t = {};
    for (let i = 0; i < e.attributes.length; i++) {
      const n = e.attributes.item(i);
      n && (t[n.name] = n.value);
    }
    return t;
  }
  static parsePoses(e) {
    const t = [], i = this.getTag(e, "Pose");
    for (let n = 0; n < i.length; n++) {
      const o = i[n], s = (o.getAttribute("ImageAnchor") || "0,0").split(","), a = (o.getAttribute("Velocity") || "0,0").split(","), c = Number(s[0]), u = Number(s[1]), h = Number(a[0]), l = Number(a[1]), d = Number(o.getAttribute("Duration") || "1");
      [c, u, h, l, d].every(Number.isFinite) && t.push({
        image: o.getAttribute("Image") || "",
        imageAnchor: { x: c, y: u },
        velocity: { x: h, y: l },
        duration: Math.max(1, Math.round(d))
      });
    }
    return t;
  }
  /** `<Hotspot Shape Origin Size Behavior>` children of an animation. libshijima's
   *  parser warns and drops a hotspot with an unknown shape or no behaviour, so the
   *  same entries are skipped here rather than guessed at. */
  static parseHotspots(e) {
    const t = [], i = this.getTag(e, "Hotspot");
    for (let n = 0; n < i.length; n++) {
      const o = i[n], s = (o.getAttribute("Shape") || "").trim();
      if (s !== "Ellipse" && s !== "Rectangle") continue;
      const a = (o.getAttribute("Behavior") || "").trim();
      if (!a) continue;
      const c = (o.getAttribute("Origin") || "").split(","), u = (o.getAttribute("Size") || "").split(","), h = parseFloat(c[0]), l = parseFloat(c[1]), d = parseFloat(u[0]), y = parseFloat(u[1]);
      ![h, l, d, y].every((A) => Number.isFinite(A)) || d <= 0 || y <= 0 || t.push({
        shape: s,
        origin: { x: h, y: l },
        size: { x: d, y },
        behavior: a
      });
    }
    return t.length > 0 ? t : void 0;
  }
  static parseBehaviors(e) {
    const t = [], i = this.getTag(e, "Behavior");
    for (let n = 0; n < i.length; n++) {
      const o = i[n], s = o.getAttribute("Name");
      if (!s) continue;
      const a = Number(o.getAttribute("Frequency") || "0"), c = Number.isFinite(a) ? Math.max(0, a) : 0, u = o.getAttribute("Hidden") === "true", h = [], l = o.getAttribute("Condition");
      l && h.push(l);
      let d = o.parentNode;
      for (; d; ) {
        if (d.localName === "Condition" || d.tagName === "Condition") {
          const b = d.getAttribute("Condition");
          b && h.unshift(b);
        }
        d = d.parentNode;
      }
      const y = h.length > 1 ? `#{${h.map((b) => `(${b.replace(/^[#$]\{|\}$/g, "")})`).join(" && ")}}` : h[0], A = [];
      let g = !0;
      const v = this.getTag(o, "NextBehaviorList")[0];
      if (v) {
        g = v.getAttribute("Add") !== "false";
        const b = this.getTag(v, "BehaviorReference");
        for (let p = 0; p < b.length; p++) {
          const I = Number(b[p].getAttribute("Frequency") || "0");
          A.push({
            name: b[p].getAttribute("Name") || "",
            frequency: Number.isFinite(I) ? Math.max(0, I) : 0,
            condition: b[p].getAttribute("Condition") || void 0
          });
        }
      }
      t.push({ name: s, id: n, frequency: c, hidden: u, condition: y, nextBehaviors: A, addNext: g });
    }
    for (const n of t)
      for (const o of n.nextBehaviors) {
        const s = t.find(
          (a) => a.name === o.name && a.frequency === o.frequency
        );
        s && (o.id = s.id);
      }
    return t;
  }
}
function F(r) {
  return {
    ...r,
    allowBehaviors: r.allowBehaviors ? [...r.allowBehaviors] : void 0,
    denyBehaviors: r.denyBehaviors ? [...r.denyBehaviors] : void 0,
    pacerExemptBehaviors: r.pacerExemptBehaviors ? [...r.pacerExemptBehaviors] : void 0,
    exitToPoolBehaviors: r.exitToPoolBehaviors ? [...r.exitToPoolBehaviors] : void 0,
    behaviorWeights: r.behaviorWeights ? { ...r.behaviorWeights } : void 0,
    actionDurations: r.actionDurations ? Object.fromEntries(
      Object.entries(r.actionDurations).map(([e, t]) => [
        e,
        Array.isArray(t) ? [...t] : t
      ])
    ) : void 0,
    actionHoldLimits: r.actionHoldLimits ? Object.fromEntries(Object.entries(r.actionHoldLimits).map(([e, t]) => [
      e,
      {
        ticks: Array.isArray(t == null ? void 0 : t.ticks) ? [...t.ticks] : t == null ? void 0 : t.ticks,
        waitPoses: Array.isArray(t == null ? void 0 : t.waitPoses) ? [...t.waitPoses] : t == null ? void 0 : t.waitPoses
      }
    ])) : void 0,
    partnerWeights: r.partnerWeights ? { ...r.partnerWeights } : void 0,
    zone: r.zone ? { ...r.zone } : void 0,
    spawn: r.spawn ? { ...r.spawn } : void 0
  };
}
const jt = Object.freeze({}), dt = Object.freeze({
  spawn: { topOffset: 100, staggerPx: 180 },
  forcedSwitchTicks: 300,
  pacerExemptBehaviors: ["SitWhileDanglingLegs"],
  exitToPoolBehaviors: ["SitWhileDanglingLegs"],
  maxBehaviorTicks: 1100,
  actionHoldLimits: {
    Stand: { ticks: [150, 250], waitPoses: [0, 2, 4] },
    Sit: { ticks: [200, 350], waitPoses: [0, 2, 4] },
    Sprawl: { ticks: [200, 350], waitPoses: [0, 2, 4] },
    GrabWall: { ticks: [200, 300], waitPoses: [0, 2, 4] },
    GrabCeiling: { ticks: [200, 300], waitPoses: [0, 2, 4] }
  },
  repeatBehaviorWeight: 0.65,
  // 20 s. The anti-chain guard in the engine only works if it has a value: with the
  // old `0` the pair re-engaged on its very next pick (observed: hurl → hug → hug
  // within one short walk, because the first selection after an interaction is
  // another live advertisement). Both offering and scanning are gated by this.
  interactionCooldownTicks: 500,
  behaviorWeights: {
    SitWhileDanglingLegs: 150,
    SitAndFaceMouse: 8
  }
}), E = class E {
  /** Register a custom preset. */
  static register(e, t) {
    const i = e.trim();
    if (!i)
      throw new Error("[PresetRegistry] Preset name cannot be empty");
    E.presets.set(i, F(t));
  }
  /**
   * Get an independent, mutable clone of a registered preset.
   * Modifying the returned object will NOT affect the registry.
   */
  static get(e) {
    const t = E.presets.get(e.trim());
    return t ? F(t) : void 0;
  }
  /** Check if a preset exists. */
  static has(e) {
    return E.presets.has(e.trim());
  }
  /** List all registered preset names. */
  static list() {
    return Array.from(E.presets.keys());
  }
  /** Get the active default preset name. */
  static getDefaultPresetName() {
    return E.defaultPresetName;
  }
  /** Set the active default preset name. */
  static setDefaultPresetName(e) {
    const t = e.trim();
    if (!E.presets.has(t))
      throw new Error(`[PresetRegistry] Preset "${e}" is not registered`);
    E.defaultPresetName = t;
  }
};
m(E, "presets", /* @__PURE__ */ new Map([
  ["lively", F(dt)],
  ["classic", F(jt)]
])), m(E, "defaultPresetName", "lively");
let se = E;
const mn = {
  $schema: "https://github.com/CommentOut64/web-mascot/blob/main/web-mascot/ANIMATION_CONFIG.md",
  version: 1,
  preset: "lively",
  // Base preset: "lively" (default web-tuned) or "classic" (Qt desktop parity)
  respectReducedMotion: !0,
  // Follow system prefers-reduced-motion (boolean, default true)
  defaults: {
    // --- 1. Pacing & Travel Limits ---
    // Request travel after 12s of stillness; finish finite behaviors and whole loops first.
    forcedSwitchTicks: 300,
    // Request a global-pool pick after 44s; never discard a finite sequence.
    maxBehaviorTicks: 1100,
    // Behaviors exempt from the travel request.
    pacerExemptBehaviors: ["SitWhileDanglingLegs"],
    // [exitToPoolBehaviors] Behaviors that return to global pool on end, breaking closed XML loops.
    exitToPoolBehaviors: ["SitWhileDanglingLegs"],
    // [maxTravelPx] Maximum horizontal wander travel distance in pixels. 0 = unlimited.
    maxTravelPx: 240,
    // --- 2. Behavior Selection & Duration Overrides ---
    // [behaviorWeights] Overrides XML <Behavior Frequency="...">. 0 = disable; >0 = enable/boost.
    behaviorWeights: {
      SitWhileDanglingLegs: 150,
      SitAndFaceMouse: 8
    },
    // [actionDurations] Overrides XML <Action> duration for Stay actions. Single number or [min, max] range.
    actionDurations: {
      // Sit: [80, 150]
    },
    // Explicit idle wait poses share a budget; other poses retain native timing.
    actionHoldLimits: F(dt).actionHoldLimits,
    repeatBehaviorWeight: 0.65,
    // [durationScale] Multiplier applied to all XML Duration attributes (0.05 ~ 20.0, 1 = unscaled).
    durationScale: 1,
    // [allowBehaviors] Whitelist: only these behaviors may appear (empty/absent = all allowed).
    allowBehaviors: [],
    // [denyBehaviors] Blacklist: behaviors that never appear (takes precedence over allowBehaviors).
    denyBehaviors: [],
    // --- 3. Sizing & Geometry ---
    // [scale] Visual size multiplier (0.2 ~ 4.0, 1.0 = native 128 px sprite).
    scale: 1,
    // [spawn] Initial spawn location and multi-mascot displacement.
    spawn: {
      vertical: "top",
      // "top" (drop from ceiling) | "floor" (start on floor)
      x: "center",
      // Horizontal position: number (px), "50%", "center", "left", "right"
      topOffset: 100,
      // Pixels below work area top for "top" spawn
      staggerPx: 180
      // Horizontal offset per already-spawned mascot to prevent stacking
    },
    // [zone] Activity bounding box (work area). Omit for full container.
    // zone: { left: 0, right: "100%", top: 0, bottom: "100%" },
    // --- 4. Partner Interactions ---
    // [scanDistancePx] Search radius (px) for partner advertisement detection (16 ~ 4096 px, default 256).
    scanDistancePx: 256,
    // [interactionCooldownTicks] Cooldown ticks after interaction before another can start.
    // 500 (20 s): the guard exists to stop the pair re-engaging on their very next pick,
    // and with 0 it never engaged — the observed chain was hurl → hug → hug within one
    // short walk, because the first selection after an interaction is another live offer.
    interactionCooldownTicks: 500,
    // [partnerWeights] Dynamic weights for partner-seeking behaviors based on presence & reachability.
    partnerWeights: {
      alone: 40,
      // When this mascot is the only one on page
      withPartner: 150,
      // When another mascot exists on page
      reachable: 1800
      // When partner is on same surface within scanDistancePx
    }
  },
  mascots: {
    // Specific per-mascot overrides merged on top of defaults
    // Neuron: { ... },
    // Eviling: { ... }
  },
  reducedMotion: {
    // Options merged on top of defaults when OS asks for reduced motion
  }
}, zt = 40, Jt = 0.05, Gt = 20, Kt = 0.2, Qt = 4, Zt = 3e3, Ve = 1e6, _t = 1e5;
function $(r) {
  return typeof r == "object" && r !== null && !Array.isArray(r);
}
function J(r) {
  if (typeof r == "number" && Number.isFinite(r)) return r;
  if (typeof r == "string" && r.trim() !== "" && Number.isFinite(Number(r))) return Number(r);
}
function fe(r) {
  if (!Array.isArray(r)) return;
  const e = r.filter((t) => typeof t == "string").map((t) => t.trim()).filter((t) => t.length > 0);
  return e.length > 0 || r.length === 0 ? e : void 0;
}
function _(r, e) {
  const t = J(r);
  if (t !== void 0)
    return Math.round(Math.min(Ve, Math.max(e, t)));
}
function be(r, e, t = _t) {
  const i = J(r);
  if (i !== void 0)
    return Math.min(t, Math.max(e, i));
}
function oe(r) {
  if (typeof r == "number" && Number.isFinite(r)) return r;
  if (typeof r == "string" && r.trim() !== "") return r.trim();
}
function ei(r, e) {
  if (typeof r != "string") return;
  const t = r.trim().toLowerCase();
  return e.includes(t) ? t : void 0;
}
function ti(r) {
  if (!$(r)) return;
  const e = {};
  for (const [t, i] of Object.entries(r)) {
    const n = t.trim(), o = J(i);
    !n || o === void 0 || o < 0 || (e[n] = Math.min(Ve, o));
  }
  return Object.keys(e).length > 0 ? e : void 0;
}
function nt(r) {
  if (!$(r)) return;
  const e = {};
  for (const [t, i] of Object.entries(r)) {
    const n = t.trim();
    if (n)
      if (Array.isArray(i)) {
        let o = _(i[0], 1), s = _(i[1], 1);
        if (o === void 0) continue;
        s === void 0 && (s = o), s < o && ([o, s] = [s, o]), e[n] = o === s ? o : [o, s];
      } else {
        const o = _(i, 1);
        if (o === void 0) continue;
        e[n] = o;
      }
  }
  return Object.keys(e).length > 0 ? e : void 0;
}
function ii(r) {
  if (!$(r)) return;
  const e = {}, t = oe(r.left);
  t !== void 0 && (e.left = t);
  const i = oe(r.right);
  i !== void 0 && (e.right = i);
  const n = oe(r.top);
  n !== void 0 && (e.top = n);
  const o = oe(r.bottom);
  return o !== void 0 && (e.bottom = o), Object.keys(e).length > 0 ? e : void 0;
}
function Be(r) {
  const e = J(r);
  if (!(e === void 0 || e < 0))
    return Math.min(Ve, e);
}
function ni(r) {
  if (!$(r)) return;
  const e = {}, t = Be(r.alone);
  t !== void 0 && (e.alone = t);
  const i = Be(r.withPartner);
  i !== void 0 && (e.withPartner = i);
  const n = Be(r.reachable);
  return n !== void 0 && (e.reachable = n), Object.keys(e).length > 0 ? e : void 0;
}
function ri(r) {
  if (!$(r)) return;
  const e = {}, t = ei(r.vertical, ["top", "floor"]);
  t && (e.vertical = t);
  const i = oe(r.x);
  i !== void 0 && (e.x = i);
  const n = be(r.staggerPx, 0);
  n !== void 0 && (e.staggerPx = n);
  const o = be(r.topOffset, 0);
  return o !== void 0 && (e.topOffset = o), Object.keys(e).length > 0 ? e : void 0;
}
function de(r) {
  var I;
  if (!$(r)) return {};
  const e = {}, t = fe(r.allowBehaviors);
  t && (e.allowBehaviors = t);
  const i = fe(r.denyBehaviors);
  i && (e.denyBehaviors = i);
  const n = ti(r.behaviorWeights);
  n && (e.behaviorWeights = n);
  const o = nt(r.actionDurations);
  if (o && (e.actionDurations = o), $(r.actionHoldLimits)) {
    const k = {};
    for (const [x, S] of Object.entries(r.actionHoldLimits)) {
      if (!$(S) || !Array.isArray(S.waitPoses) || !S.waitPoses.length || S.waitPoses.some((N) => !Number.isInteger(N) || N < 0)) continue;
      const R = (I = nt({ hold: S.ticks })) == null ? void 0 : I.hold;
      x.trim() && R !== void 0 && (k[x.trim()] = { ticks: R, waitPoses: [...new Set(S.waitPoses)] });
    }
    Object.keys(k).length && (e.actionHoldLimits = k);
  }
  const s = J(r.repeatBehaviorWeight);
  s !== void 0 && (e.repeatBehaviorWeight = Math.max(0, Math.min(1, s)));
  const a = J(r.durationScale);
  a !== void 0 && (e.durationScale = Math.min(Gt, Math.max(Jt, a)));
  const c = J(r.scale);
  c !== void 0 && (e.scale = Math.min(Qt, Math.max(Kt, c)));
  const u = _(r.forcedSwitchTicks, 0);
  u !== void 0 && (e.forcedSwitchTicks = u);
  const h = fe(r.pacerExemptBehaviors);
  h && (e.pacerExemptBehaviors = h);
  const l = fe(r.exitToPoolBehaviors);
  l && (e.exitToPoolBehaviors = l);
  const d = _(r.interactionCooldownTicks, 0);
  d !== void 0 && (e.interactionCooldownTicks = Math.min(Zt, d));
  const y = _(r.maxBehaviorTicks, 0);
  y !== void 0 && (e.maxBehaviorTicks = y);
  const A = be(r.maxTravelPx, 0);
  A !== void 0 && (e.maxTravelPx = A);
  const g = ni(r.partnerWeights);
  g && (e.partnerWeights = g);
  const v = be(r.scanDistancePx, 16, 4096);
  v !== void 0 && (e.scanDistancePx = v);
  const b = ii(r.zone);
  b && (e.zone = b);
  const p = ri(r.spawn);
  return p && (e.spawn = p), e;
}
function Ce(r, e) {
  return {
    allowBehaviors: e.allowBehaviors ?? r.allowBehaviors,
    denyBehaviors: e.denyBehaviors ?? r.denyBehaviors,
    behaviorWeights: { ...r.behaviorWeights, ...e.behaviorWeights },
    actionDurations: { ...r.actionDurations, ...e.actionDurations },
    actionHoldLimits: { ...r.actionHoldLimits, ...e.actionHoldLimits },
    repeatBehaviorWeight: e.repeatBehaviorWeight ?? r.repeatBehaviorWeight,
    durationScale: e.durationScale ?? r.durationScale,
    scale: e.scale ?? r.scale,
    forcedSwitchTicks: e.forcedSwitchTicks ?? r.forcedSwitchTicks,
    pacerExemptBehaviors: e.pacerExemptBehaviors ?? r.pacerExemptBehaviors,
    exitToPoolBehaviors: e.exitToPoolBehaviors ?? r.exitToPoolBehaviors,
    interactionCooldownTicks: e.interactionCooldownTicks ?? r.interactionCooldownTicks,
    maxBehaviorTicks: e.maxBehaviorTicks ?? r.maxBehaviorTicks,
    maxTravelPx: e.maxTravelPx ?? r.maxTravelPx,
    partnerWeights: { ...r.partnerWeights, ...e.partnerWeights },
    scanDistancePx: e.scanDistancePx ?? r.scanDistancePx,
    zone: { ...r.zone, ...e.zone },
    spawn: { ...r.spawn, ...e.spawn }
  };
}
function rt(r) {
  return r.allowBehaviors !== void 0 || r.denyBehaviors !== void 0 || r.behaviorWeights !== void 0 && Object.keys(r.behaviorWeights).length > 0 || r.actionDurations !== void 0 && Object.keys(r.actionDurations).length > 0 || r.actionHoldLimits !== void 0 && Object.keys(r.actionHoldLimits).length > 0 || r.repeatBehaviorWeight !== void 0 || r.durationScale !== void 0 || r.scale !== void 0 || r.forcedSwitchTicks !== void 0 || r.pacerExemptBehaviors !== void 0 && r.pacerExemptBehaviors.length > 0 || r.exitToPoolBehaviors !== void 0 && r.exitToPoolBehaviors.length > 0 || r.interactionCooldownTicks !== void 0 || r.maxBehaviorTicks !== void 0 || r.maxTravelPx !== void 0 || r.partnerWeights !== void 0 && Object.keys(r.partnerWeights).length > 0 || r.scanDistancePx !== void 0 || r.zone !== void 0 && Object.keys(r.zone).length > 0 || r.spawn !== void 0 && Object.keys(r.spawn).length > 0;
}
class ge {
  constructor(e, t = "(preset defaults)") {
    m(this, "presetName", "lively");
    m(this, "defaults", {});
    m(this, "perMascot", /* @__PURE__ */ new Map());
    m(this, "reduced", {});
    m(this, "reducedActive", !1);
    m(this, "respectReduced", !0);
    m(this, "respectBuiltin", !0);
    m(this, "resolved", /* @__PURE__ */ new Map());
    /** Where the settings came from, for logs and diagnostics. */
    m(this, "source");
    this.source = t, this.apply(e);
  }
  /** Replace the settings. Invalid input leaves the config empty (= pack default). */
  apply(e) {
    if (this.defaults = {}, this.perMascot = /* @__PURE__ */ new Map(), this.reduced = {}, this.respectReduced = !0, this.respectBuiltin = !0, this.presetName = se.getDefaultPresetName(), this.resolved = /* @__PURE__ */ new Map(), !$(e)) return;
    typeof e.preset == "string" && e.preset.trim() && (this.presetName = e.preset.trim()), e.ignoreBuiltin === !0 ? (this.presetName = "classic", this.respectBuiltin = !1) : e.ignoreBuiltin === !1 && (this.respectBuiltin = !0), this.defaults = de(e.defaults), this.reduced = de(e.reducedMotion), this.respectReduced = e.respectReducedMotion !== !1;
    const t = e.mascots;
    if ($(t))
      for (const [i, n] of Object.entries(t)) {
        const o = i.trim();
        o && this.perMascot.set(o, de(n));
      }
    this.refreshReducedMotion();
  }
  /** Get the current base preset name. */
  getPreset() {
    return this.presetName;
  }
  /** Switch the base preset. Clears cached resolved options. */
  setPreset(e) {
    this.presetName = e.trim(), this.respectBuiltin = this.presetName !== "classic", this.resolved.clear();
  }
  /** Called by the engine when the OS preference changes. */
  setReducedMotion(e) {
    this.reducedActive !== e && (this.reducedActive = e, this.resolved.clear());
  }
  /** Re-read the OS preference (used at load time and on change). */
  refreshReducedMotion() {
    let e = !1;
    if (this.respectReduced && typeof window < "u" && typeof window.matchMedia == "function")
      try {
        e = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        e = !1;
      }
    return this.setReducedMotion(e), e;
  }
  get reducedMotionActive() {
    return this.reducedActive;
  }
  /** True when this configuration cannot affect anything: preset is classic and host supplied nothing. */
  get isEmpty() {
    return this.presetName === "classic" && !rt(this.defaults) && this.perMascot.size === 0 && !rt(this.reduced);
  }
  /** Effective options: base preset (from PresetRegistry), then defaults, then reduced-motion, then mascot overrides. */
  optionsFor(e) {
    const t = this.resolved.get(e);
    if (t) return F(t);
    const i = se.get(this.presetName) ?? se.get("lively") ?? {};
    let n = de(i), o = Ce(n, this.defaults);
    return o = Ce(o, this.reducedActive ? this.reduced : {}), o = Ce(o, this.perMascot.get(e) ?? {}), this.resolved.set(e, o), F(o);
  }
  /** Whether a behaviour may be selected for this mascot. */
  allows(e, t) {
    var n;
    const i = this.optionsFor(e);
    return !((n = i.denyBehaviors) != null && n.includes(t) || i.allowBehaviors && i.allowBehaviors.length > 0 && !i.allowBehaviors.includes(t));
  }
  /** Explicitly forbidden. Unlike `allows()`, this ignores `allowBehaviors`, which
   *  only restricts random selection — a visitor-triggered hotspot is deliberate. */
  denies(e, t) {
    var i;
    return ((i = this.optionsFor(e).denyBehaviors) == null ? void 0 : i.includes(t)) ?? !1;
  }
  /** Weight override for a behaviour, or undefined to keep the pack's Frequency. */
  weightOverride(e, t) {
    var i;
    return (i = this.optionsFor(e).behaviorWeights) == null ? void 0 : i[t];
  }
  /** Effective selection weight, falling back to the pack's Frequency. */
  weight(e, t, i) {
    return this.weightOverride(e, t) ?? i;
  }
  scale(e) {
    return this.optionsFor(e).durationScale ?? 1;
  }
  /** Linear size multiplier for the drawn mascot (virtual unit = one sprite px). */
  mascotScale(e) {
    return this.optionsFor(e).scale ?? 1;
  }
  forcedSwitchTicks(e) {
    return this.optionsFor(e).forcedSwitchTicks ?? 0;
  }
  /** May the pacer request a new pick after this behavior or a complete loop? */
  pacerApplies(e, t) {
    var i;
    return t ? !(((i = this.optionsFor(e).pacerExemptBehaviors) == null ? void 0 : i.includes(t)) ?? !1) : !0;
  }
  /** Does this behaviour re-enter the global pool when it ends, bypassing the pack's
   *  `<NextBehaviorList>`? Needed for the packs' closed chains (see the option docs). */
  exitsToPool(e, t) {
    var i;
    return t ? ((i = this.optionsFor(e).exitToPoolBehaviors) == null ? void 0 : i.includes(t)) ?? !1 : !1;
  }
  /** Ticks during which partner behaviours stay out of the pool after an interaction. */
  interactionCooldown(e) {
    return this.optionsFor(e).interactionCooldownTicks ?? 0;
  }
  maxBehaviorTicks(e) {
    return this.optionsFor(e).maxBehaviorTicks ?? 0;
  }
  maxTravelPx(e) {
    return this.optionsFor(e).maxTravelPx ?? 0;
  }
  /** Weight to use for a partner behaviour, or null to keep the pack's Frequency.
   *  `reachable` is the "another mascot is right here and level with me" case. */
  partnerWeight(e, t, i = !1) {
    const n = this.optionsFor(e).partnerWeights;
    if (!n) return null;
    if (i && n.reachable !== void 0) return n.reachable;
    const o = t ? n.withPartner : n.alone;
    return o === void 0 ? null : o;
  }
  /** How far this mascot scans for a partner advertisement. */
  scanDistancePx(e) {
    return this.optionsFor(e).scanDistancePx ?? 256;
  }
  zone(e) {
    return this.optionsFor(e).zone ?? {};
  }
  spawn(e) {
    return this.optionsFor(e).spawn ?? {};
  }
  /**
   * A hold duration in ticks for an action, picked once from its `[min,max]`
   * range, or null when the action is not configured. The caller must call this
   * once per action instance: calling it per tick would re-roll the range.
   */
  durationTicks(e, t) {
    var i;
    return this.sampleDuration(t ? (i = this.optionsFor(e).actionDurations) == null ? void 0 : i[t] : void 0);
  }
  holdLimitTicks(e, t) {
    var i, n;
    return this.sampleDuration(t ? (n = (i = this.optionsFor(e).actionHoldLimits) == null ? void 0 : i[t]) == null ? void 0 : n.ticks : void 0);
  }
  sampleDuration(e) {
    if (e === void 0) return null;
    if (typeof e == "number") return e;
    const [t, i] = e;
    return i <= t ? t : t + Math.floor(Math.random() * (i - t + 1));
  }
  /** True when this action has an explicit duration override. */
  hasDurationOverride(e, t) {
    var i;
    return t ? ((i = this.optionsFor(e).actionDurations) == null ? void 0 : i[t]) !== void 0 : !1;
  }
  /** Round-trip view of the raw file shape, for a settings UI. */
  toJSON() {
    const e = {};
    for (const [i, n] of this.perMascot) e[i] = F(n);
    const t = {
      version: 1,
      preset: this.presetName,
      defaults: F(this.defaults),
      mascots: e,
      reducedMotion: F(this.reduced),
      respectReducedMotion: this.respectReduced
    };
    return (!this.respectBuiltin || this.presetName === "classic") && (t.ignoreBuiltin = !0), t;
  }
  /** One-line summary written into the observation log with every spawn. */
  describe(e) {
    const t = this.optionsFor(e);
    return [
      `source=${this.source}[preset=${this.presetName}]${this.presetName !== "classic" && this.respectBuiltin ? " +builtin" : " no-builtin"}`,
      `durationScale=${t.durationScale ?? 1}`,
      `scale=${t.scale ?? 1}`,
      `cap=${t.maxBehaviorTicks ?? 0}`,
      `pacer=${t.forcedSwitchTicks ?? 0}`,
      `cooldown=${t.interactionCooldownTicks ?? 0}`,
      `travel=${t.maxTravelPx ?? 0}`,
      `partner=${t.partnerWeights ? `${t.partnerWeights.alone ?? "-"}/${t.partnerWeights.withPartner ?? "-"}/${t.partnerWeights.reachable ?? "-"}` : "pack"}`,
      `scan=${t.scanDistancePx ?? 256}`,
      `allow=${t.allowBehaviors ? t.allowBehaviors.length : "all"}`,
      `deny=${t.denyBehaviors ? t.denyBehaviors.length : 0}`,
      `weights=${t.behaviorWeights ? Object.keys(t.behaviorWeights).length : 0}`,
      `durations=${t.actionDurations ? Object.keys(t.actionDurations).length : 0}`,
      `holds=${Object.keys(t.actionHoldLimits ?? {}).length}`,
      `repeat=${t.repeatBehaviorWeight ?? 1}`,
      `zone=${t.zone && Object.keys(t.zone).length ? JSON.stringify(t.zone) : "full"}`,
      `spawn=${t.spawn && Object.keys(t.spawn).length ? JSON.stringify(t.spawn) : "default"}`,
      `reduced=${this.reducedActive ? "on" : "off"}`
    ].join(" ");
  }
  /** Human-readable list of the effective settings, for logs. */
  details(e) {
    var o, s;
    const t = this.optionsFor(e), i = [], n = (a) => `${(a * zt / 1e3).toFixed(1)}s`;
    return t.allowBehaviors && i.push(`allowBehaviors: ${t.allowBehaviors.join(", ")}`), t.denyBehaviors && i.push(`denyBehaviors: ${t.denyBehaviors.join(", ")}`), t.behaviorWeights && Object.keys(t.behaviorWeights).length > 0 && i.push(
      `behaviorWeights: ${Object.entries(t.behaviorWeights).map(([a, c]) => `${a}=${c}`).join(", ")}`
    ), t.actionDurations && Object.keys(t.actionDurations).length > 0 && i.push(
      `actionDurations: ${Object.entries(t.actionDurations).map(([a, c]) => `${a}=${Array.isArray(c) ? `[${c[0]},${c[1]}]` : c}ticks`).join(", ")}`
    ), t.actionHoldLimits && Object.keys(t.actionHoldLimits).length > 0 && i.push(`actionHoldLimits: ${JSON.stringify(t.actionHoldLimits)} (idle waits only; complete pose order)`), t.repeatBehaviorWeight !== void 0 && i.push(`repeatBehaviorWeight: ${t.repeatBehaviorWeight}`), t.durationScale !== void 0 && i.push(`durationScale: ${t.durationScale}`), t.scale !== void 0 && i.push(`scale: ${t.scale}x (1 virtual unit = 1 sprite px, drawn ${t.scale}x)`), t.interactionCooldownTicks && i.push(
      `interactionCooldownTicks: ${t.interactionCooldownTicks} (${n(t.interactionCooldownTicks)})`
    ), t.forcedSwitchTicks && i.push(`forcedSwitchTicks: ${t.forcedSwitchTicks} (${n(t.forcedSwitchTicks)})`), (o = t.pacerExemptBehaviors) != null && o.length && i.push(`pacerExemptBehaviors: ${t.pacerExemptBehaviors.join(", ")}`), (s = t.exitToPoolBehaviors) != null && s.length && i.push(`exitToPoolBehaviors: ${t.exitToPoolBehaviors.join(", ")}`), t.maxBehaviorTicks && i.push(`maxBehaviorTicks: ${t.maxBehaviorTicks} (${n(t.maxBehaviorTicks)})`), t.maxTravelPx && i.push(`maxTravelPx: ${t.maxTravelPx}px`), t.partnerWeights && Object.keys(t.partnerWeights).length > 0 && i.push(
      `partnerWeights: alone=${t.partnerWeights.alone ?? "pack"} withPartner=${t.partnerWeights.withPartner ?? "pack"} reachable=${t.partnerWeights.reachable ?? "pack"}`
    ), t.zone && Object.keys(t.zone).length > 0 && i.push(`zone: ${JSON.stringify(t.zone)}`), t.spawn && Object.keys(t.spawn).length > 0 && i.push(`spawn: ${JSON.stringify(t.spawn)}`), this.reducedActive && i.push("reducedMotion: active (OS preference)"), i;
  }
}
class oi {
  constructor(e, t, i, n) {
    m(this, "anchor");
    m(this, "clientBehavior", "");
    m(this, "serverBehavior", "");
    m(this, "finalized", !1);
    m(this, "available", !0);
    m(this, "metUp", !1);
    m(this, "shared", null);
    this.owner = t, this.accepts = i, this.surface = n, this.anchor = { ...e };
  }
  get active() {
    return !this.finalized;
  }
  get isAvailable() {
    return this.active && this.available;
  }
  /**
   * A scanner has claimed this advertisement and is on its way. libshijima has no
   * such state: the advertising animation ends when it wants to, the claim is
   * finalized with it, and the approaching scanner is dropped on its next tick.
   * The owner of the advertisement needs to be able to see the claim so it can
   * hold its pose until the partner arrives (see BroadcastManager).
   */
  get isClaimed() {
    return this.active && !this.available && !this.metUp;
  }
  get didMeetUp() {
    return this.metUp;
  }
  /** Keep the advertised position in sync with the broadcasting mascot. */
  updateAnchor(e) {
    this.active && (this.anchor = { ...e });
  }
  notifyArrival() {
    this.metUp = !0, this.finalized = !0;
  }
  /** The action that advertised this affordance ended. */
  finalize() {
    this.finalized = !0;
  }
  setAvailable(e) {
    this.available = e;
  }
  interaction() {
    return this.shared || (this.shared = { value: !0 }), new qe(this.shared, this.serverBehavior);
  }
  ongoingPoint() {
    return this.shared || (this.shared = { value: !0 }), this.shared;
  }
}
class qe {
  constructor(e = null, t = "") {
    m(this, "started", !1);
    m(this, "shared");
    m(this, "name");
    this.shared = e, this.name = t;
  }
  get available() {
    return this.shared !== null;
  }
  get ongoing() {
    return this.shared !== null && this.shared.value;
  }
  get behavior() {
    return this.name;
  }
  /** Ends the interaction for both sides. */
  finalize() {
    this.shared && (this.shared.value = !1), this.shared = null, this.name = "", this.started = !1;
  }
}
class ot {
  constructor(e = null, t = !1) {
    m(this, "server");
    this.reserved = t, this.server = e;
  }
  get connected() {
    return this.server !== null && this.server.active;
  }
  get target() {
    return this.server ? this.server.anchor : null;
  }
  notifyArrival() {
    this.server && this.server.notifyArrival();
  }
  interaction() {
    return new qe(this.server ? this.server.ongoingPoint() : null, this.server ? this.server.clientBehavior : "");
  }
  /** Dropping the link frees the broadcast for another scanner. */
  finalize() {
    this.server && this.server.setAvailable(!0), this.server = null;
  }
}
const ce = class ce {
  constructor() {
    m(this, "servers", /* @__PURE__ */ new Map());
  }
  /** Remove finalized advertisements that can no longer be reached. */
  prune() {
    for (const [e, t] of this.servers) {
      const i = t.filter((n) => n.active);
      i.length === 0 ? this.servers.delete(e) : i.length !== t.length && this.servers.set(e, i);
    }
  }
  startBroadcast(e, t, i, n, o) {
    const s = new oi(t, i, n, o), a = this.servers.get(e);
    return a ? a.push(s) : this.servers.set(e, [s]), s;
  }
  tryConnect(e, t, i, n, o = ce.MAX_SCAN_DISTANCE, s) {
    const a = this.findAvailable(e, t, o, s, n);
    return a ? (a.clientBehavior = i, a.serverBehavior = n, a.setAvailable(!1), new ot(a)) : null;
  }
  /** Reserve a same-surface advertisement so a ScanMove can approach it from afar. */
  tryReserve(e, t, i, n, o, s) {
    const a = this.findReachable(e, t, o, s, n);
    return a ? (a.clientBehavior = i, a.serverBehavior = n, a.setAvailable(!1), new ot(a, !0)) : null;
  }
  /** Read-only counterpart of tryConnect: selection and claiming use identical gates. */
  findAvailable(e, t, i = ce.MAX_SCAN_DISTANCE, n, o) {
    const s = this.servers.get(e);
    if (!s || s.length === 0) return null;
    const a = s.filter((h) => h.active);
    this.servers.set(e, a);
    let c = null, u = i;
    for (const h of a) {
      if (!h.isAvailable || n !== void 0 && h.owner === n || o && h.accepts && !h.accepts(o) || Math.abs(t.y - h.anchor.y) > 1) continue;
      const l = Math.abs(t.x - h.anchor.x);
      l > i || (c === null || l < u) && (c = h, u = l);
    }
    return c;
  }
  /** Read-only candidate lookup for a same-surface approach. */
  findReachable(e, t, i, n, o) {
    const s = this.servers.get(e);
    if (!s || s.length === 0) return null;
    const a = s.filter((h) => h.active);
    this.servers.set(e, a);
    let c = null, u = 1 / 0;
    for (const h of a) {
      if (!h.isAvailable || n !== void 0 && h.owner === n || o && h.accepts && !h.accepts(o) || i !== "Floor" || h.surface !== "Floor" || Math.abs(t.y - h.anchor.y) > 1) continue;
      const l = Math.abs(t.x - h.anchor.x);
      (c === null || l < u) && (c = h, u = l);
    }
    return c;
  }
  /** Diagnostics for the observation log: what a scan would have seen. */
  probe(e, t) {
    const i = (this.servers.get(e) ?? []).filter((o) => o.active);
    let n = null;
    for (const o of i) {
      const s = Math.abs(t.x - o.anchor.x);
      (n === null || s < n) && (n = s);
    }
    return { live: i.length, nearest: n };
  }
  /** Live broadcasts per affordance name, for the observation log. */
  snapshot() {
    this.prune();
    const e = {};
    for (const [t, i] of this.servers) {
      const n = i.filter((o) => o.active).length;
      n > 0 && (e[t] = n);
    }
    return e;
  }
};
/** `broadcast/manager.cc`: ScanMove only claims a mascot that is already near. */
m(ce, "MAX_SCAN_DISTANCE", 256);
let Me = ce;
function si(r, e) {
  const { x: t, y: i } = r.origin, { x: n, y: o } = r.size;
  if (n <= 0 || o <= 0) return !1;
  if (r.shape === "Ellipse") {
    const s = (e.x - (t + n / 2)) / n, a = (e.y - (i + o / 2)) / o;
    return s * s + a * a < 1;
  }
  return e.x >= t && e.x <= t + n && e.y >= i && e.y <= i + o;
}
function ai(r, e) {
  if (!r) return null;
  let t = null;
  for (const i of r)
    si(i, e) && (t = i);
  return t;
}
const ci = "neurolingsce-mascot-page-v1", Ie = "__neurolingsce_mascot_page_v1__:", gt = 1500, pt = gt * 3, G = typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`, Ae = /* @__PURE__ */ new Set(), O = /* @__PURE__ */ new Map();
let V = null, q = "none", vt = 0, st = 0, Ye = !1, ke = !0, xe = !1;
const at = `${Ie}${G}`;
function At(r) {
  if (!r) return null;
  try {
    const e = JSON.parse(r);
    if (!e || typeof e != "object") return null;
    const t = e;
    return typeof t.id != "string" || typeof t.visible != "boolean" || typeof t.focusedAt != "number" || typeof t.sentAt != "number" ? null : t;
  } catch {
    return null;
  }
}
function ct(r) {
  if (ke !== r) {
    ke = r;
    for (const e of Ae) e(r);
  }
}
function ie() {
  var t;
  if (q === "none") {
    ct(!0);
    return;
  }
  const r = Date.now();
  for (const [i, n] of O)
    r - n.seenAt > pt && O.delete(i);
  const e = Array.from(O.values()).filter((i) => i.visible);
  e.sort((i, n) => n.focusedAt - i.focusedAt || i.id.localeCompare(n.id)), ct(((t = e[0]) == null ? void 0 : t.id) === G);
}
function He(r, e = Date.now()) {
  if (r.id === G) return;
  const t = O.get(r.id);
  t && t.sentAt >= r.sentAt || (O.set(r.id, { ...r, seenAt: e }), ie());
}
function hi(r) {
  r.type === "leave" ? (O.delete(r.id), ie()) : He(r.state);
}
function yt(r) {
  if (q === "broadcast")
    try {
      V == null || V.postMessage(r);
      return;
    } catch {
      q = "none";
    }
  else if (q === "storage")
    try {
      r.type === "leave" ? localStorage.removeItem(at) : localStorage.setItem(at, JSON.stringify(r.state));
      return;
    } catch {
      q = "none";
    }
  ie();
}
function le() {
  const r = Date.now(), e = !Ye && document.visibilityState === "visible";
  e && document.hasFocus() && (st = r);
  const t = { id: G, visible: e, focusedAt: st, sentAt: r };
  O.set(G, { ...t, seenAt: r }), yt({ type: "state", state: t }), ie();
}
function bt() {
  O.delete(G), yt({ type: "leave", id: G }), ie();
}
function It(r) {
  var i;
  if (!((i = r.key) != null && i.startsWith(Ie))) return;
  const e = r.key.slice(Ie.length);
  if (!r.newValue) {
    O.delete(e), ie();
    return;
  }
  const t = At(r.newValue);
  t && He(t);
}
function kt() {
  le();
}
function xt() {
  le();
}
function St() {
  Ye = !0, bt();
}
function wt() {
  Ye = !1, le();
}
function li() {
  xe = !0;
  try {
    V = new BroadcastChannel(ci), V.addEventListener("message", (r) => hi(r.data)), q = "broadcast";
  } catch {
    try {
      q = "storage", window.addEventListener("storage", It);
      for (let r = 0; r < localStorage.length; r++) {
        const e = localStorage.key(r);
        if (!(e != null && e.startsWith(Ie))) continue;
        const t = At(localStorage.getItem(e));
        t && Date.now() - t.sentAt <= pt && He(t, t.sentAt);
      }
    } catch {
      q = "none";
    }
  }
  window.addEventListener("focus", kt), document.addEventListener("visibilitychange", xt), window.addEventListener("pagehide", St), window.addEventListener("pageshow", wt), vt = window.setInterval(le, gt), le();
}
function mi() {
  xe && (bt(), xe = !1, window.clearInterval(vt), window.removeEventListener("focus", kt), document.removeEventListener("visibilitychange", xt), window.removeEventListener("pagehide", St), window.removeEventListener("pageshow", wt), window.removeEventListener("storage", It), V == null || V.close(), V = null, O.clear(), q = "none", ke = !0);
}
function ui(r) {
  return xe || li(), Ae.add(r), r(ke), () => {
    Ae.delete(r), Ae.size === 0 && mi();
  };
}
function Tt(r, e, t, i) {
  return {
    x: i.left + (r - t.left) * (i.right - i.left) / (t.right - t.left),
    y: i.top + (e - t.top) * (i.bottom - i.top) / (t.bottom - t.top)
  };
}
function fi(r, e) {
  const t = Tt(r.x, r.y, r.area, e);
  return r.anchorX === "left" && (t.x = e.left), r.anchorX === "right" && (t.x = e.right), r.anchorY === "ceiling" && (t.y = e.top), r.anchorY === "floor" && (t.y = e.bottom), t;
}
const di = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor", "call", "apply", "bind"]);
function gi(r) {
  const e = /* @__PURE__ */ new Map();
  let t = 0;
  for (const i of r) {
    if (i.kind !== "operator") continue;
    if (i.value === "(") {
      t++;
      continue;
    }
    if (i.value === ")") {
      t--;
      continue;
    }
    if (i.value !== "??" && i.value !== "||" && i.value !== "&&") continue;
    const n = e.get(t) ?? { nullish: !1, logical: !1 };
    if (i.value === "??" ? n.nullish = !0 : n.logical = !0, n.nullish && n.logical)
      throw new SyntaxError("cannot mix ?? with || or && without parentheses");
    e.set(t, n);
  }
}
function pi(r) {
  const e = [];
  let t = 0;
  for (; t < r.length; ) {
    const i = r[t];
    if (/\s/.test(i)) {
      t++;
      continue;
    }
    if (/[0-9]/.test(i) || i === "." && /[0-9]/.test(r[t + 1] ?? "")) {
      const o = r.slice(t).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
      if (!o) throw new Error("invalid number");
      const s = Number(o[0]);
      if (!Number.isFinite(s)) throw new Error("invalid number");
      e.push({ kind: "number", value: s }), t += o[0].length;
      continue;
    }
    if (/[A-Za-z_$]/.test(i)) {
      const o = r.slice(t).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
      e.push({ kind: "identifier", value: o[0] }), t += o[0].length;
      continue;
    }
    if (i === "'" || i === '"') {
      const o = i;
      let s = "";
      t++;
      let a = !1;
      for (; t < r.length; ) {
        const c = r[t++];
        if (c === o) {
          a = !0;
          break;
        }
        if (c === "\\") {
          const u = r[t++];
          if (u === void 0) break;
          s += u;
        } else
          s += c;
      }
      if (!a) throw new Error("unterminated string");
      e.push({ kind: "string", value: s });
      continue;
    }
    const n = r.slice(t).match(/^(===|!==|==|!=|<=|>=|&&|\|\||\?\?|[()+\-*/%!?<>=.,:])/);
    if (!n) throw new Error(`unsupported token '${i}'`);
    e.push({ kind: "operator", value: n[0] }), t += n[0].length;
  }
  return e.push({ kind: "eof" }), e;
}
class vi {
  constructor(e, t) {
    m(this, "index", 0);
    m(this, "tokens");
    m(this, "scope");
    this.tokens = e, this.scope = t;
  }
  parse() {
    const e = this.conditional();
    if (this.peek().kind !== "eof") throw new Error("unexpected token");
    return e;
  }
  peek() {
    return this.tokens[this.index];
  }
  take(e) {
    const t = this.peek();
    if (e !== void 0 && (t.kind !== "operator" || t.value !== e))
      throw new Error(`expected '${e}'`);
    return this.index++, t;
  }
  conditional(e = !0) {
    const t = this.logicalOr(e);
    if (this.peek().kind !== "operator" || this.peek().value !== "?") return t;
    this.take("?");
    const i = this.conditional(e && !!t);
    this.take(":");
    const n = this.conditional(e && !t);
    return e ? t ? i : n : void 0;
  }
  logicalOr(e = !0) {
    let t = this.logicalAnd(e);
    for (; this.peek().kind === "operator" && this.peek().value === "||"; ) {
      this.take("||");
      const i = e && !!t, n = this.logicalAnd(e && !i);
      t = e ? i ? t : n : void 0;
    }
    for (; this.peek().kind === "operator" && this.peek().value === "??"; ) {
      this.take("??");
      const i = this.logicalAnd(e && t === null);
      t = e ? t ?? i : void 0;
    }
    return t;
  }
  logicalAnd(e = !0) {
    let t = this.equality(e);
    for (; this.peek().kind === "operator" && this.peek().value === "&&"; ) {
      this.take("&&");
      const i = e && !t, n = this.equality(e && !i);
      t = e ? i ? t : n : void 0;
    }
    return t;
  }
  equality(e = !0) {
    let t = this.comparison(e);
    for (; this.peek().kind === "operator" && ["===", "!==", "==", "!="].includes(this.peek().value); ) {
      const i = this.take().value, n = this.comparison(e);
      if (e) {
        const o = i === "===" || i === "!==" ? t === n : t === n || t == null && n == null || String(t) === String(n);
        t = i === "!=" || i === "!==" ? !o : o;
      }
    }
    return t;
  }
  comparison(e = !0) {
    let t = this.additive(e);
    for (; this.peek().kind === "operator" && ["<", "<=", ">", ">="].includes(this.peek().value); ) {
      const i = this.take().value, n = this.additive(e);
      if (e)
        switch (i) {
          case "<":
            t = t < n;
            break;
          case "<=":
            t = t <= n;
            break;
          case ">":
            t = t > n;
            break;
          default:
            t = t >= n;
            break;
        }
    }
    return t;
  }
  additive(e = !0) {
    let t = this.multiplicative(e);
    for (; this.peek().kind === "operator" && ["+", "-"].includes(this.peek().value); ) {
      const i = this.take().value, n = this.multiplicative(e);
      e && (t = i === "+" ? t + n : t - n);
    }
    return t;
  }
  multiplicative(e = !0) {
    let t = this.unary(e);
    for (; this.peek().kind === "operator" && ["*", "/", "%"].includes(this.peek().value); ) {
      const i = this.take().value, n = this.unary(e);
      e && (i === "*" ? t = t * n : i === "/" ? t = t / n : t = t % n);
    }
    return t;
  }
  unary(e = !0) {
    if (this.peek().kind === "operator" && ["!", "+", "-"].includes(this.peek().value)) {
      const t = this.take().value, i = this.unary(e);
      return e ? t === "!" ? !i : t === "+" ? +i : -i : void 0;
    }
    return this.postfix(e).value;
  }
  postfix(e = !0) {
    let t = this.primary(e);
    for (; ; ) {
      if (this.peek().kind === "operator" && this.peek().value === ".") {
        this.take(".");
        const i = this.take();
        if (i.kind !== "identifier") throw new Error("expected property");
        t = { value: e ? this.readProperty(t.value, i.value) : void 0, receiver: t.value };
        continue;
      }
      if (this.peek().kind === "operator" && this.peek().value === "(") {
        this.take("(");
        const i = [];
        if (!(this.peek().kind === "operator" && this.peek().value === ")"))
          do {
            if (i.push(this.conditional(e)), !(this.peek().kind === "operator" && this.peek().value === ",")) break;
            this.take(",");
          } while (!0);
        if (this.take(")"), !e) {
          t = { value: void 0, receiver: void 0 };
          continue;
        }
        if (typeof t.value != "function") throw new Error("value is not callable");
        t = { value: t.value.apply(t.receiver, i), receiver: void 0 };
        continue;
      }
      return t;
    }
  }
  primary(e = !0) {
    const t = this.take();
    if (t.kind === "number" || t.kind === "string") return { value: t.value, receiver: void 0 };
    if (t.kind === "identifier") {
      if (t.value === "true") return { value: !0, receiver: void 0 };
      if (t.value === "false") return { value: !1, receiver: void 0 };
      if (t.value === "null") return { value: null, receiver: void 0 };
      if (t.value === "undefined") return { value: void 0, receiver: void 0 };
      if (t.value === "typeof") {
        const i = this.unary(e);
        return { value: e ? typeof i : void 0, receiver: void 0 };
      }
      if (!e) return { value: void 0, receiver: void 0 };
      if (!(t.value in this.scope)) throw new Error(`unknown identifier '${t.value}'`);
      return { value: e ? this.scope[t.value] : void 0, receiver: void 0 };
    }
    if (t.kind === "operator" && t.value === "(") {
      const i = this.conditional(e);
      return this.take(")"), { value: i, receiver: void 0 };
    }
    throw new Error("expected value");
  }
  /** Only own properties are exposed; prototype members are intentionally sandboxed. */
  readProperty(e, t) {
    if (di.has(t) || e === null || e === void 0)
      throw new Error("property access denied");
    if (typeof e != "object" && typeof e != "function" || !Object.prototype.hasOwnProperty.call(e, t))
      throw new Error(`unknown property '${t}'`);
    return e[t];
  }
}
function Ai(r, e) {
  const t = pi(r);
  return gi(t), new vi(t, e).parse();
}
function yi(r, e, t) {
  if (!r.length || !e.length || e.some((d) => d < 0 || d >= r.length)) return null;
  const i = [...new Set(e)], n = r.map((d) => Math.max(1, d)), o = n.reduce((d, y, A) => d + (i.includes(A) ? 0 : y), 0), s = Math.max(i.length, Math.round(t) - o) - i.length, a = i.map((d) => Math.max(1, n[d] - 1)), c = a.reduce((d, y) => d + y, 0), u = a.map((d) => s * d / c);
  i.forEach((d, y) => {
    n[d] = 1 + Math.floor(u[y]);
  });
  const h = u.map((d, y) => ({ i: y, remainder: d - Math.floor(d) })).sort((d, y) => y.remainder - d.remainder || d.i - y.i), l = s - u.reduce((d, y) => d + Math.floor(y), 0);
  for (let d = 0; d < l; d++) n[i[h[d].i]]++;
  return n;
}
const W = { debug: 0, info: 1, warn: 2, error: 3 }, bi = () => typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
class Pe {
  /** @internal — hosts get handles from `loggerFor()`. */
  constructor(e) {
    m(this, "channel");
    this.channel = e;
  }
  /** True when nothing would be emitted, including the console. Call sites may
   *  use it to skip building an expensive `data` object. */
  get active() {
    return j;
  }
  get level() {
    return Nt;
  }
  debug(e, t) {
    !j || W.debug < ye || pe("debug", this.channel, e, t);
  }
  info(e, t) {
    !j || W.info < ye || pe("info", this.channel, e, t);
  }
  warn(e, t) {
    !j || W.warn < ye || pe("warn", this.channel, e, t);
  }
  error(e, t) {
    j && pe("error", this.channel, e, t);
  }
}
const Ii = {
  engine: new Pe("engine"),
  observe: new Pe("observe"),
  logger: new Pe("logger")
};
function ki(r) {
  return Ii[r];
}
let Nt = "info", ye = W.info, j = !1, ee = !1, Se = "[web-mascot]", te = [];
const Rt = (r, e) => e ? `${r} ${xi(e)}` : r;
function xi(r) {
  try {
    return JSON.stringify(r);
  } catch {
    return "[unserialisable]";
  }
}
function Si(r) {
  const e = Se;
  if (e == null) return "";
  if (typeof e == "function")
    try {
      return e(r);
    } catch {
      return "[web-mascot]";
    }
  return e;
}
let Bt = W.info;
function pe(r, e, t, i) {
  const n = { t: bi(), level: r, channel: e, message: `${Si(e)} ${t}` };
  if (i !== void 0 && (n.data = i), ee && W[r] >= Bt) {
    const o = i ? Rt(n.message, i) : n.message, s = r === "debug" ? "debug" : r;
    try {
      (console[s] ?? console.log)(o);
    } catch {
    }
  }
  for (let o = 0; o < te.length; o++) {
    const s = te[o];
    if (!(W[r] < W[s.level]))
      try {
        s.sink(n);
      } catch {
      }
  }
}
function un(r) {
  r.console === !1 || r.console === void 0 ? ee = !1 : (ee = !0, Bt = W[r.console === !0 ? "info" : r.console]), r.sinks && (te = r.sinks.slice()), r.level && (Nt = r.level, ye = W[r.level]), r.prefix !== void 0 && (Se = r.prefix), j = ee || te.length > 0;
}
function fn() {
  j = !1, ee = !1, te = [];
}
function dn() {
  return {
    active: j,
    console: ee,
    prefix: typeof Se == "function" ? "(function)" : String(Se),
    sinks: te.map((r) => `${r.name}>=${r.level}`)
  };
}
function gn(r = "info") {
  return {
    name: "console",
    level: r,
    sink: (e) => {
      const t = e.data ? Rt(e.message, e.data) : e.message;
      (console[e.level] ?? console.log)(t);
    }
  };
}
class $e {
  /**
   * Register a custom mascot pack in memory.
   * If a pack with the same name already exists, its previous blob URLs will be revoked.
   */
  static register(e) {
    if (!e || !e.name)
      throw new Error("[web-mascot] Cannot register a pack without a name");
    this.unregister(e.name), this.packs.set(e.name, e);
  }
  /**
   * Retrieve a registered in-memory pack.
   */
  static get(e) {
    return this.packs.get(e);
  }
  /**
   * Check if an in-memory pack is registered.
   */
  static has(e) {
    return this.packs.has(e);
  }
  /**
   * Unregister an in-memory pack and release any Blob URLs it created to prevent memory leaks.
   */
  static unregister(e) {
    const t = this.packs.get(e);
    if (!t) return !1;
    for (const i of t.sprites.values())
      if (typeof i == "string" && i.startsWith("blob:"))
        try {
          URL.revokeObjectURL(i);
        } catch {
        }
    return this.packs.delete(e);
  }
  /**
   * Clear all registered in-memory packs and revoke all associated Blob URLs.
   */
  static clear() {
    for (const e of Array.from(this.packs.keys()))
      this.unregister(e);
  }
  /**
   * List all currently registered pack names.
   */
  static list() {
    return Array.from(this.packs.keys());
  }
}
m($e, "packs", /* @__PURE__ */ new Map());
var C = Uint8Array, Z = Uint16Array, wi = Int32Array, Ct = new C([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]), Pt = new C([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]), Ti = new C([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Dt = function(r, e) {
  for (var t = new Z(31), i = 0; i < 31; ++i)
    t[i] = e += 1 << r[i - 1];
  for (var n = new wi(t[30]), i = 1; i < 30; ++i)
    for (var o = t[i]; o < t[i + 1]; ++o)
      n[o] = o - t[i] << 5 | i;
  return { b: t, r: n };
}, Lt = Dt(Ct, 2), Et = Lt.b, Ni = Lt.r;
Et[28] = 258, Ni[258] = 28;
var Ri = Dt(Pt, 0), Bi = Ri.b, Oe = new Z(32768);
for (var w = 0; w < 32768; ++w) {
  var U = (w & 43690) >> 1 | (w & 21845) << 1;
  U = (U & 52428) >> 2 | (U & 13107) << 2, U = (U & 61680) >> 4 | (U & 3855) << 4, Oe[w] = ((U & 65280) >> 8 | (U & 255) << 8) >> 1;
}
var ae = function(r, e, t) {
  for (var i = r.length, n = 0, o = new Z(e); n < i; ++n)
    r[n] && ++o[r[n] - 1];
  var s = new Z(e);
  for (n = 1; n < e; ++n)
    s[n] = s[n - 1] + o[n - 1] << 1;
  var a;
  if (t) {
    a = new Z(1 << e);
    var c = 15 - e;
    for (n = 0; n < i; ++n)
      if (r[n])
        for (var u = n << 4 | r[n], h = e - r[n], l = s[r[n] - 1]++ << h, d = l | (1 << h) - 1; l <= d; ++l)
          a[Oe[l] >> c] = u;
  } else
    for (a = new Z(i), n = 0; n < i; ++n)
      r[n] && (a[n] = Oe[s[r[n] - 1]++] >> 15 - r[n]);
  return a;
}, me = new C(288);
for (var w = 0; w < 144; ++w)
  me[w] = 8;
for (var w = 144; w < 256; ++w)
  me[w] = 9;
for (var w = 256; w < 280; ++w)
  me[w] = 7;
for (var w = 280; w < 288; ++w)
  me[w] = 8;
var Ft = new C(32);
for (var w = 0; w < 32; ++w)
  Ft[w] = 5;
var Ci = /* @__PURE__ */ ae(me, 9, 1), Pi = /* @__PURE__ */ ae(Ft, 5, 1), De = function(r) {
  for (var e = r[0], t = 1; t < r.length; ++t)
    r[t] > e && (e = r[t]);
  return e;
}, L = function(r, e, t) {
  var i = e / 8 | 0;
  return (r[i] | r[i + 1] << 8) >> (e & 7) & t;
}, Le = function(r, e) {
  var t = e / 8 | 0;
  return (r[t] | r[t + 1] << 8 | r[t + 2] << 16) >> (e & 7);
}, Di = function(r) {
  return (r + 7) / 8 | 0;
}, Ue = function(r, e, t) {
  return (e == null || e < 0) && (e = 0), (t == null || t > r.length) && (t = r.length), new C(r.subarray(e, t));
}, Li = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
], B = function(r, e, t) {
  var i = new Error(e || Li[r]);
  if (i.code = r, Error.captureStackTrace && Error.captureStackTrace(i, B), !t)
    throw i;
  return i;
}, Ei = function(r, e, t, i) {
  var n = r.length, o = i ? i.length : 0;
  if (!n || e.f && !e.l)
    return t || new C(0);
  var s = !t, a = s || e.i != 2, c = e.i;
  s && (t = new C(n * 3));
  var u = function(_e) {
    var et = t.length;
    if (_e > et) {
      var tt = new C(Math.max(et * 2, _e));
      tt.set(t), t = tt;
    }
  }, h = e.f || 0, l = e.p || 0, d = e.b || 0, y = e.l, A = e.d, g = e.m, v = e.n, b = n * 8;
  do {
    if (!y) {
      h = L(r, l, 1);
      var p = L(r, l + 1, 3);
      if (l += 3, p)
        if (p == 1)
          y = Ci, A = Pi, g = 9, v = 5;
        else if (p == 2) {
          var S = L(r, l, 31) + 257, R = L(r, l + 10, 15) + 4, N = S + L(r, l + 5, 31) + 1;
          l += 14;
          for (var Y = new C(N), we = new C(19), P = 0; P < R; ++P)
            we[Ti[P]] = L(r, l + P * 3, 7);
          l += R * 3;
          for (var ze = De(we), Ot = (1 << ze) - 1, Wt = ae(we, ze, 1), P = 0; P < N; ) {
            var Je = Wt[L(r, l, Ot)];
            l += Je & 15;
            var I = Je >> 4;
            if (I < 16)
              Y[P++] = I;
            else {
              var K = 0, ue = 0;
              for (I == 16 ? (ue = 3 + L(r, l, 3), l += 2, K = Y[P - 1]) : I == 17 ? (ue = 3 + L(r, l, 7), l += 3) : I == 18 && (ue = 11 + L(r, l, 127), l += 7); ue--; )
                Y[P++] = K;
            }
          }
          var Ge = Y.subarray(0, S), H = Y.subarray(S);
          g = De(Ge), v = De(H), y = ae(Ge, g, 1), A = ae(H, v, 1);
        } else
          B(1);
      else {
        var I = Di(l) + 4, k = r[I - 4] | r[I - 3] << 8, x = I + k;
        if (x > n) {
          c && B(0);
          break;
        }
        a && u(d + k), t.set(r.subarray(I, x), d), e.b = d += k, e.p = l = x * 8, e.f = h;
        continue;
      }
      if (l > b) {
        c && B(0);
        break;
      }
    }
    a && u(d + 131072);
    for (var Xt = (1 << g) - 1, Vt = (1 << v) - 1, Te = l; ; Te = l) {
      var K = y[Le(r, l) & Xt], Q = K >> 4;
      if (l += K & 15, l > b) {
        c && B(0);
        break;
      }
      if (K || B(2), Q < 256)
        t[d++] = Q;
      else if (Q == 256) {
        Te = l, y = null;
        break;
      } else {
        var Ke = Q - 254;
        if (Q > 264) {
          var P = Q - 257, ne = Ct[P];
          Ke = L(r, l, (1 << ne) - 1) + Et[P], l += ne;
        }
        var Ne = A[Le(r, l) & Vt], Re = Ne >> 4;
        Ne || B(3), l += Ne & 15;
        var H = Bi[Re];
        if (Re > 3) {
          var ne = Pt[Re];
          H += Le(r, l) & (1 << ne) - 1, l += ne;
        }
        if (l > b) {
          c && B(0);
          break;
        }
        a && u(d + 131072);
        var Qe = d + Ke;
        if (d < H) {
          var Ze = o - H, qt = Math.min(H, Qe);
          for (Ze + d < 0 && B(3); d < qt; ++d)
            t[d] = i[Ze + d];
        }
        for (; d < Qe; ++d)
          t[d] = t[d - H];
      }
    }
    e.l = y, e.p = Te, e.b = d, e.f = h, y && (h = 1, e.m = g, e.d = A, e.n = v);
  } while (!h);
  return d != t.length && s ? Ue(t, 0, d) : t.subarray(0, d);
}, Fi = /* @__PURE__ */ new C(0), M = function(r, e) {
  return r[e] | r[e + 1] << 8;
}, D = function(r, e) {
  return (r[e] | r[e + 1] << 8 | r[e + 2] << 16 | r[e + 3] << 24) >>> 0;
}, Ee = function(r, e) {
  return D(r, e) + D(r, e + 4) * 4294967296;
};
function Mi(r, e) {
  return Ei(r, { i: 2 }, e && e.out, e && e.dictionary);
}
var We = typeof TextDecoder < "u" && /* @__PURE__ */ new TextDecoder(), $i = 0;
try {
  We.decode(Fi, { stream: !0 }), $i = 1;
} catch {
}
var Oi = function(r) {
  for (var e = "", t = 0; ; ) {
    var i = r[t++], n = (i > 127) + (i > 223) + (i > 239);
    if (t + n > r.length)
      return { s: e, r: Ue(r, t - 1) };
    n ? n == 3 ? (i = ((i & 15) << 18 | (r[t++] & 63) << 12 | (r[t++] & 63) << 6 | r[t++] & 63) - 65536, e += String.fromCharCode(55296 | i >> 10, 56320 | i & 1023)) : n & 1 ? e += String.fromCharCode((i & 31) << 6 | r[t++] & 63) : e += String.fromCharCode((i & 15) << 12 | (r[t++] & 63) << 6 | r[t++] & 63) : e += String.fromCharCode(i);
  }
};
function Wi(r, e) {
  if (e) {
    for (var t = "", i = 0; i < r.length; i += 16384)
      t += String.fromCharCode.apply(null, r.subarray(i, i + 16384));
    return t;
  } else {
    if (We)
      return We.decode(r);
    var n = Oi(r), o = n.s, t = n.r;
    return t.length && B(8), o;
  }
}
var Xi = function(r, e) {
  return e + 30 + M(r, e + 26) + M(r, e + 28);
}, Vi = function(r, e, t) {
  var i = M(r, e + 28), n = M(r, e + 30), o = Wi(r.subarray(e + 46, e + 46 + i), !(M(r, e + 8) & 2048)), s = e + 46 + i, a = qi(r, s, n, t, D(r, e + 20), D(r, e + 24), D(r, e + 42)), c = a[0], u = a[1], h = a[2];
  return [M(r, e + 10), c, u, o, s + n + M(r, e + 32), h];
}, qi = function(r, e, t, i, n, o, s) {
  var a = n == 4294967295, c = o == 4294967295, u = s == 4294967295, h = e + t, l = a + c + u;
  if (i && l) {
    for (; e + 4 < h; e += 4 + M(r, e + 2))
      if (M(r, e) == 1)
        return [
          a ? Ee(r, e + 4 + 8 * c) : n,
          c ? Ee(r, e + 4) : o,
          u ? Ee(r, e + 4 + 8 * (c + a)) : s,
          1
        ];
    i < 2 && B(13);
  }
  return [n, o, s, 0];
};
function Yi(r, e) {
  for (var t = {}, i = r.length - 22; D(r, i) != 101010256; --i)
    (!i || r.length - i > 65558) && B(13);
  var n = M(r, i + 8);
  if (!n)
    return {};
  var o = D(r, i + 16), s = D(r, i - 20) == 117853008;
  if (s) {
    var a = D(r, i - 12);
    s = D(r, a) == 101075792, s && (n = D(r, a + 32), o = D(r, a + 48));
  }
  for (var c = 0; c < n; ++c) {
    var u = Vi(r, o, s), h = u[0], l = u[1], d = u[2], y = u[3], A = u[4], g = u[5], v = Xi(r, g);
    o = A, h ? h == 8 ? t[y] = Mi(r.subarray(v, v + l), { out: new C(d) }) : B(14, "unknown compression type " + h) : t[y] = Ue(r, v, v + l);
  }
  return t;
}
const Hi = `\uFEFF<?xml version="1.0" encoding="UTF-8" ?>\r
<Mascot xmlns="http://www.group-finity.com/Mascot" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\r
	xsi:schemaLocation="http://www.group-finity.com/Mascot Mascot.xsd">\r
\r
	<ActionList>\r
		<Action Name="Look" Type="Embedded" Class="com.group_finity.mascot.action.Look" />\r
		<Action Name="Offset" Type="Embedded" Class="com.group_finity.mascot.action.Offset" />\r
\r
		<!-- Standing -->\r
\r
		<Action Name="Stand" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Walk" Type="Move" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
				<Pose Image="/shime2.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
				<Pose Image="/shime3.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Run" Type="Move" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="-4,0" Duration="2" />\r
				<Pose Image="/shime2.png" ImageAnchor="64,128" Velocity="-4,0" Duration="2" />\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="-4,0" Duration="2" />\r
				<Pose Image="/shime3.png" ImageAnchor="64,128" Velocity="-4,0" Duration="2" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Dash" Type="Move" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
				<Pose Image="/shime2.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
				<Pose Image="/shime3.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
			</Animation>\r
		</Action>\r
\r
		<!-- Sitting -->\r
\r
		<Action Name="Sit" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime11.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
		<Action Name="SitAndLookUp" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime26.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="SitAndLookAtMouse" Type="Stay" BorderType="Floor">\r
			<Animation Condition="#{mascot.environment.cursor.y &lt; mascot.environment.screen.height/2}">\r
				<Pose Image="/shime26.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
			<Animation>\r
				<Pose Image="/shime11.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="SitAndSpinHeadAction" Type="Animate" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime26.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime15.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime27.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime16.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime28.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime17.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime29.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime11.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="SitWithLegsUp" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime30.png" ImageAnchor="64,112" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="SitWithLegsDown" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime31.png" ImageAnchor="64,112" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="SitAndDangleLegs" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime31.png" ImageAnchor="64,112" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime32.png" ImageAnchor="64,112" Velocity="0,0" Duration="15" />\r
				<Pose Image="/shime31.png" ImageAnchor="64,112" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime33.png" ImageAnchor="64,112" Velocity="0,0" Duration="15" />\r
			</Animation>\r
		</Action>\r
\r
		<!-- Laying -->\r
\r
		<Action Name="Sprawl" Type="Stay" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime21.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Creep" Type="Move" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime20.png" ImageAnchor="64,128" Velocity="0,0" Duration="28" />\r
				<Pose Image="/shime20.png" ImageAnchor="64,128" Velocity="-2,0" Duration="4" />\r
				<Pose Image="/shime21.png" ImageAnchor="64,128" Velocity="-2,0" Duration="4" />\r
				<Pose Image="/shime21.png" ImageAnchor="64,128" Velocity="-1,0" Duration="4" />\r
				<Pose Image="/shime21.png" ImageAnchor="64,128" Velocity="0,0" Duration="24" />\r
			</Animation>\r
		</Action>\r
\r
		<!-- Ceiling -->\r
\r
		<Action Name="GrabCeiling" Type="Stay" BorderType="Ceiling">\r
			<Animation>\r
				<Pose Image="/shime23.png" ImageAnchor="64,48" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
		\r
		<Action Name="ClimbCeiling" Type="Move" BorderType="Ceiling">\r
			<Animation>\r
				<Pose Image="/shime25.png" ImageAnchor="64,48" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime25.png" ImageAnchor="64,48" Velocity="-1,0" Duration="4" />\r
				<Pose Image="/shime23.png" ImageAnchor="64,48" Velocity="-1,0" Duration="4" />\r
				<Pose Image="/shime24.png" ImageAnchor="64,48" Velocity="-1,0" Duration="4" />\r
				<Pose Image="/shime24.png" ImageAnchor="64,48" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime24.png" ImageAnchor="64,48" Velocity="-2,0" Duration="4" />\r
				<Pose Image="/shime23.png" ImageAnchor="64,48" Velocity="-2,0" Duration="4" />\r
				<Pose Image="/shime25.png" ImageAnchor="64,48" Velocity="-2,0" Duration="4" />\r
			</Animation>\r
		</Action>\r
\r
		<!-- Wall -->\r
\r
		<Action Name="GrabWall" Type="Stay" BorderType="Wall">\r
			<Animation>\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
		<Action Name="ClimbWall" Type="Move" BorderType="Wall">\r
			<Animation Condition="#{TargetY &lt; mascot.anchor.y}">\r
				<Pose Image="/shime14.png" ImageAnchor="64,128" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime14.png" ImageAnchor="64,128" Velocity="0,-1" Duration="4" />\r
				<Pose Image="/shime12.png" ImageAnchor="64,128" Velocity="0,-1" Duration="4" />\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,-1" Duration="4" />\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,-2" Duration="4" />\r
				<Pose Image="/shime12.png" ImageAnchor="64,128" Velocity="0,-2" Duration="4" />\r
				<Pose Image="/shime14.png" ImageAnchor="64,128" Velocity="0,-2" Duration="4" />\r
			</Animation>\r
\r
			<Animation Condition="#{TargetY &gt;= mascot.anchor.y}">\r
				<Pose Image="/shime14.png" ImageAnchor="64,128" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime14.png" ImageAnchor="64,128" Velocity="0,2" Duration="4" />\r
				<Pose Image="/shime12.png" ImageAnchor="64,128" Velocity="0,2" Duration="4" />\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,2" Duration="4" />\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime13.png" ImageAnchor="64,128" Velocity="0,1" Duration="4" />\r
				<Pose Image="/shime12.png" ImageAnchor="64,128" Velocity="0,1" Duration="4" />\r
				<Pose Image="/shime14.png" ImageAnchor="64,128" Velocity="0,1" Duration="4" />\r
			</Animation>\r
		</Action>\r
\r
		<!-- IE -->\r
\r
		<Action Name="FallWithIe" Type="Embedded" Class="com.group_finity.mascot.action.FallWithIE"\r
			 IeOffsetX="0" IeOffsetY="-64">\r
			<Animation>\r
				<Pose Image="/shime36.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
		<Action Name="WalkWithIe" BorderType="Floor" Type="Embedded" Class="com.group_finity.mascot.action.WalkWithIE"\r
			 IeOffsetX="0" IeOffsetY="-64">\r
			<Animation>\r
				<Pose Image="/shime34.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
				<Pose Image="/shime35.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
				<Pose Image="/shime34.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
				<Pose Image="/shime36.png" ImageAnchor="64,128" Velocity="-2,0" Duration="6" />\r
			</Animation>\r
		</Action>\r
		<Action Name="RunWithIe" BorderType="Floor" Type="Embedded" Class="com.group_finity.mascot.action.WalkWithIE"\r
			 IeOffsetX="0" IeOffsetY="-64">\r
			<Animation>\r
				<Pose Image="/shime34.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
				<Pose Image="/shime35.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
				<Pose Image="/shime34.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
				<Pose Image="/shime36.png" ImageAnchor="64,128" Velocity="-8,0" Duration="2" />\r
			</Animation>\r
		</Action>\r
		<Action Name="ThrowIe" BorderType="Floor" Type="Embedded" Class="com.group_finity.mascot.action.ThrowIE"\r
			InitialVX="32" InitialVY="-10" Gravity="0.5">\r
			<Animation>\r
				<Pose Image="/shime37.png" ImageAnchor="64,128" Velocity="0,0" Duration="40" />\r
			</Animation>\r
		</Action>\r
\r
		<!-- Falling -->\r
\r
		<Action Name="Jumping" Type="Embedded" Class="com.group_finity.mascot.action.Jump"\r
			VelocityParam="20">\r
			<Animation>\r
				<Pose Image="/shime22.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Falling" Type="Embedded" Class="com.group_finity.mascot.action.Fall"\r
			RegistanceX="0.05" RegistanceY="0.1" Gravity="2">\r
			<Animation>\r
				<Pose Image="/shime4.png" ImageAnchor="64,128" Velocity="0,0" Duration="250" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Bouncing" Type="Animate" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime18.png" ImageAnchor="64,128" Velocity="0,0" Duration="4" />\r
				<Pose Image="/shime19.png" ImageAnchor="64,128" Velocity="0,0" Duration="4" />\r
			</Animation>\r
		</Action>\r
\r
		<Action Name="Tripping" Type="Animate" BorderType="Floor">\r
			<Animation>\r
				<Pose Image="/shime19.png" ImageAnchor="64,128" Velocity="-8,0" Duration="8" />\r
				<Pose Image="/shime18.png" ImageAnchor="64,128" Velocity="-4,0" Duration="4" />\r
				<Pose Image="/shime20.png" ImageAnchor="64,128" Velocity="-2,0" Duration="4" />\r
				<Pose Image="/shime20.png" ImageAnchor="64,128" Velocity="0,0" Duration="10" />\r
				<Pose Image="/shime19.png" ImageAnchor="64,104" Velocity="-4,0" Duration="4" />\r
			</Animation>\r
		</Action>\r
\r
\r
		<!-- Dragging -->\r
\r
		<Action Name="Pinched" Type="Embedded" Class="com.group_finity.mascot.action.Dragged">\r
			<Animation Condition="#{FootX &lt; mascot.environment.cursor.x-50}">\r
				<Pose Image="/shime9.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
			<Animation Condition="#{FootX &lt; mascot.environment.cursor.x-30}">\r
				<Pose Image="/shime7.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
			<Animation Condition="#{FootX &lt; mascot.environment.cursor.x}">\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
			<Animation Condition="#{FootX &gt; mascot.environment.cursor.x-10 &amp;&amp; FootX &lt; mascot.environment.cursor.x+10}">\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
			<Animation Condition="#{FootX &lt; mascot.environment.cursor.x+30}">\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5"/>\r
			</Animation>\r
			<Animation Condition="#{FootX &lt; mascot.environment.cursor.x+50}">\r
				<Pose Image="/shime8.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
			<Animation Condition="#{FootX &gt;= mascot.environment.cursor.x+30}">\r
				<Pose Image="/shime10.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
			</Animation>\r
		</Action>\r
		<Action Name="Resisting" Type="Embedded" Class="com.group_finity.mascot.action.Regist">\r
			<Animation>\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="0,0" Duration="50" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="0,0" Duration="100" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime5.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime6.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
			</Animation>\r
		</Action>\r
\r
	</ActionList>\r
\r
	<!-- Actual Behavior -->\r
	<ActionList>\r
\r
		<!-- ALWAYS REQUIRED -->\r
		<Action Name="Fall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Falling"/>\r
			<Action Type="Select">\r
				<Action Type="Sequence" Condition="\${mascot.environment.floor.isOn(mascot.anchor) ||\r
					mascot.environment.activeIE.topBorder.isOn(mascot.anchor) }">\r
					<ActionReference Name="Bouncing"/>\r
					<ActionReference Name="Stand" Duration="\${100+Math.random()*100}" />\r
				</Action>\r
				<ActionReference Name="GrabWall" Duration="100" />\r
			</Action>\r
		</Action>\r
\r
		<!-- ALWAYS REQUIRED -->\r
		<Action Name="Dragged" Type="Sequence" Loop="true">\r
			<ActionReference Name="Pinched"/>\r
			<ActionReference Name="Resisting" />\r
		</Action>\r
\r
		<!-- ALWAYS REQUIRED -->\r
		<Action Name="Thrown" Type="Sequence" Loop="false">\r
			<ActionReference Name="Falling" InitialVX="\${mascot.environment.cursor.dx}" InitialVY="\${mascot.environment.cursor.dy}"/>\r
			<Action Type="Select">\r
				<Action Type="Sequence" Condition="\${mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor) }">\r
					<ActionReference Name="Bouncing"/>\r
					<ActionReference Name="Stand" Duration="\${100+Math.random()*100}" />\r
				</Action>\r
				<ActionReference Name="GrabWall" Duration="100" />\r
			</Action>\r
		</Action>\r
\r
		<Action Name="StandUp" Type="Sequence" Loop="false">\r
			<ActionReference Name="Stand" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="SitDown" Type="Sequence" Loop="false">\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="LieDown" Type="Sequence" Loop="false">\r
			<ActionReference Name="Sprawl" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="SitWhileDanglingLegs" Type="Sequence" Loop="false">\r
			<ActionReference Name="SitWithLegsUp" Duration="10" />\r
			<ActionReference Name="SitWithLegsDown" Duration="\${100+Math.random()*100}" />\r
			<ActionReference Name="SitAndDangleLegs" Duration="\${500+Math.random()*100}" />\r
			<ActionReference Name="SitWithLegsDown" Duration="\${100+Math.random()*100}" />\r
			<ActionReference Name="SitWithLegsUp" Duration="10" />\r
		</Action>\r
\r
		<Action Name="HoldOntoWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="GrabWall" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="FallFromWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Offset" X="\${mascot.lookRight ? -1 : 1}" />\r
			<ActionReference Name="Stand" />\r
		</Action>\r
\r
		<Action Name="HoldOntoCeiling" Type="Sequence" Loop="false">\r
			<ActionReference Name="GrabCeiling" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="FallFromCeiling" Type="Sequence" Loop="false">\r
			<ActionReference Name="Offset" Y="1" />\r
			<ActionReference Name="Stand" />\r
		</Action>\r
\r
		<Action Name="WalkAlongWorkAreaFloor" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.workArea.left+64+Math.random()*(mascot.environment.workArea.width-128)}" />\r
		</Action>\r
\r
		<Action Name="RunAlongWorkAreaFloor" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.workArea.left+64+Math.random()*(mascot.environment.workArea.width-128)}" />\r
		</Action>\r
\r
		<Action Name="CrawlAlongWorkAreaFloor" Type="Sequence" Loop="false">\r
			<ActionReference Name="Creep" TargetX="\${mascot.environment.workArea.left+64+Math.random()*(mascot.environment.workArea.width-128)}" />\r
		</Action>\r
\r
		<Action Name="WalkLeftAlongFloorAndSit" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.workArea.left+100+Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Look" LookRight="true" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="WalkRightAlongFloorAndSit" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.workArea.right-100-Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Look" LookRight="false" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="GrabWorkAreaBottomLeftWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="#{mascot.environment.workArea.left}" />\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.workArea.bottom-64}" />\r
		</Action>\r
\r
		<Action Name="GrabWorkAreaBottomRightWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="#{mascot.environment.workArea.right}" />\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.workArea.bottom-64}" />\r
		</Action>\r
\r
		<Action Name="WalkLeftAndSit" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.workArea.left+100+Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Look" LookRight="true" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="WalkRightAndSit" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.workArea.right-100-Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Look" LookRight="false" />\r
			<ActionReference Name="Stand" Duration="\${20+Math.random()*20}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="WalkAndGrabBottomLeftWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="#{mascot.environment.workArea.left}" />\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.workArea.bottom-64}" />\r
		</Action>\r
\r
		<Action Name="WalkAndGrabBottomRightWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="#{mascot.environment.workArea.right}" />\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.workArea.bottom-64}" />\r
		</Action>\r
\r
		<Action Name="JumpFromBottomOfIE" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${(mascot.anchor.x*3+mascot.environment.activeIE.left+Math.random()*mascot.environment.activeIE.width)/4}"\r
				 TargetY="\${mascot.environment.activeIE.bottom}" />\r
			<ActionReference Name="GrabCeiling" Duration="\${100+Math.random()*100}" />\r
		</Action>\r
\r
		<Action Name="ClimbHalfwayAlongWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbWall" TargetY="\${mascot.environment.workArea.top+64 + Math.random()*(mascot.environment.workArea.height-128)}" />\r
		</Action>\r
\r
		<Action Name="ClimbAlongWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.workArea.top+64}" />\r
			<ActionReference Name="Offset" Y="-64" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="ClimbCeiling" TargetX="\${mascot.lookRight ? mascot.environment.workArea.left+Math.random()*100 : mascot.environment.workArea.right-Math.random*100}" />\r
		</Action>\r
\r
		<Action Name="ClimbAlongCeiling" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbCeiling" TargetX="\${mascot.environment.workArea.left+64+Math.random()*(mascot.environment.workArea.width-128)}" />\r
		</Action>\r
\r
		<Action Name="WalkAlongIECeiling" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.activeIE.left+64+Math.random()*(mascot.environment.activeIE.width-128)}" />\r
		</Action>\r
\r
		<Action Name="RunAlongIECeiling" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.activeIE.left+64+Math.random()*(mascot.environment.activeIE.width-128)}" />\r
		</Action>\r
\r
		<Action Name="CrawlAlongIECeiling" Type="Sequence" Loop="false">\r
			<ActionReference Name="Creep" TargetX="\${mascot.environment.activeIE.left+64+Math.random()*(mascot.environment.activeIE.width-128)}" />\r
		</Action>\r
\r
		<Action Name="SitOnTheLeftEdgeOfIE" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.activeIE.left+100+Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${100+Math.random()*100}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="SitOnTheRightEdgeOfIE" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.activeIE.right-100-Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${100+Math.random()*100}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="JumpFromLeftEdgeOfIE" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.activeIE.left+Math.random()*50}" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
			<ActionReference Name="Falling" InitialVX="\${-15-Math.random()*5}" InitialVY="\${-20-Math.random()*5}"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
\r
		<Action Name="JumpFromRightEdgeOfIE" Type="Sequence" Loop="false">\r
			<ActionReference Name="Walk" TargetX="\${mascot.environment.activeIE.right-Math.random()*50}" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
			<ActionReference Name="Falling" InitialVX="\${15+Math.random()*5}" InitialVY="\${-20-Math.random()*5}"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
\r
		<Action Name="WalkLeftAlongIEAndSit" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.activeIE.left+100+Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${100+Math.random()*100}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="WalkRightAlongIEAndSit" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.activeIE.right-100-Math.random()*300}" />\r
			<ActionReference Name="Stand" Duration="\${100+Math.random()*100}" />\r
			<ActionReference Name="Sit" Duration="\${500+Math.random()*1000}" />\r
		</Action>\r
\r
		<Action Name="WalkLeftAlongIEAndJump" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.activeIE.left+Math.random()*50}" />\r
			<ActionReference Name="Falling" InitialVX="\${-15-Math.random()*5}" InitialVY="\${-20-Math.random()*5}"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
\r
		<Action Name="WalkRightAlongIEAndJump" Type="Sequence" Loop="false">\r
			<ActionReference Name="Run" TargetX="\${mascot.environment.activeIE.right-Math.random()*50}" />\r
			<ActionReference Name="Falling" InitialVX="\${15+Math.random()*5}" InitialVY="\${-20-Math.random()*5}"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
\r
		<Action Name="DashIeCeilingLeftEdgeFromJump" Type="Sequence" Loop="false">\r
			<ActionReference Name="Dash" TargetX="\${mascot.environment.activeIE.left+Math.random()*20+20}" />\r
			<ActionReference Name="Falling" InitialVX="\${-5-Math.random()*2}" InitialVY="\${-20-Math.random()*5}"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
\r
		<Action Name="DashIeCeilingRightEdgeFromJump" Type="Sequence" Loop="false">\r
			<ActionReference Name="Dash" TargetX="\${mascot.environment.activeIE.right-Math.random()*20-20}" />\r
			<ActionReference Name="Falling" InitialVX="\${5+Math.random()*2}" InitialVY="\${-20-Math.random()*5}"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
\r
		<Action Name="HoldOntoIEWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbWall" TargetY="\${mascot.environment.activeIE.top+64 + Math.random()*(mascot.environment.activeIE.height-128)}" />\r
		</Action>\r
\r
		<Action Name="ClimbIEWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.activeIE.top+64}" />\r
			<ActionReference Name="Offset" Y="-64" />\r
			<ActionReference Name="Sit" Duration="5" />\r
			<ActionReference Name="Stand" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Walk" TargetX="\${mascot.lookRight ? mascot.environment.activeIE.left+Math.random()*100 : mascot.environment.activeIE.right-Math.random*100}" />\r
		</Action>\r
\r
		<Action Name="ClimbIEBottom" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbCeiling" TargetX="\${mascot.environment.activeIE.left+64+(Math.random()*mascot.environment.activeIE.width-128)}" />\r
		</Action>\r
\r
		<Action Name="GrabIEBottomLeftWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbCeiling" TargetX="#{mascot.environment.activeIE.left}" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.activeIE.bottom-64}" />\r
		</Action>\r
\r
		<Action Name="GrabIEBottomRightWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="ClimbCeiling" TargetX="#{mascot.environment.activeIE.right}" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="ClimbWall" TargetY="#{mascot.environment.activeIE.bottom-64}" />\r
		</Action>\r
\r
		<Action Name="JumpFromLeftWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.workArea.left}" TargetY="\${mascot.environment.workArea.bottom-Math.random()*mascot.environment.workArea.height/4}" />\r
			<ActionReference Name="GrabWall" Duration="\${100+Math.random()*100}" />\r
		</Action>\r
\r
		<Action Name="JumpFromRightWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.workArea.right}" TargetY="\${mascot.environment.workArea.bottom-Math.random()*mascot.environment.workArea.height/4}" />\r
			<ActionReference Name="GrabWall" Duration="\${100+Math.random()*100}" />\r
		</Action>\r
\r
		<Action Name="JumpOnIELeftWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.activeIE.left}" TargetY="\${mascot.environment.activeIE.bottom-Math.random()*mascot.environment.activeIE.height/4}" />\r
			<ActionReference Name="GrabWall" Duration="\${100+Math.random()*100}" />\r
		</Action>\r
\r
		<Action Name="JumpOnIERightWall" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.activeIE.right}" TargetY="\${mascot.environment.activeIE.bottom-Math.random()*mascot.environment.activeIE.height/4}" />\r
			<ActionReference Name="GrabWall" Duration="\${100+Math.random()*100}" />\r
		</Action>\r
\r
		<Action Name="ThrowIEFromLeft" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.activeIE.left}" TargetY="\${mascot.environment.activeIE.bottom+64}" />\r
			<ActionReference Name="FallWithIe" />\r
			<ActionReference Name="WalkWithIe" TargetX="#{mascot.environment.workArea.right-400}" />\r
			<ActionReference Name="ThrowIe" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
		</Action>\r
		<Action Name="ThrowIEFromRight" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.activeIE.right}" TargetY="\${mascot.environment.activeIE.bottom+64}" />\r
			<ActionReference Name="FallWithIe" />\r
			<ActionReference Name="WalkWithIe" TargetX="#{mascot.environment.workArea.left+400}" />\r
			<ActionReference Name="ThrowIe" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
		</Action>\r
		<Action Name="WalkAndThrowIEFromRight" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.activeIE.left}" TargetY="\${mascot.environment.activeIE.bottom+64}" />\r
			<ActionReference Name="FallWithIe" />\r
			<ActionReference Name="RunWithIe" TargetX="#{mascot.environment.workArea.right-400}" />\r
			<ActionReference Name="ThrowIe" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
		</Action>\r
		<Action Name="WalkAndThrowIEFromLeft" Type="Sequence" Loop="false">\r
			<ActionReference Name="Jumping" TargetX="\${mascot.environment.activeIE.right}" TargetY="\${mascot.environment.activeIE.bottom+64}" />\r
			<ActionReference Name="FallWithIe" />\r
			<ActionReference Name="RunWithIe" TargetX="#{mascot.environment.workArea.left+400}" />\r
			<ActionReference Name="ThrowIe" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="Stand" Duration="\${50+Math.random()*50}" />\r
		</Action>\r
\r
		<Action Name="ChaseMouse" Type="Sequence" Loop="false">\r
			<Action Type="Sequence" Condition="\${mascot.environment.ceiling.isOn(mascot.anchor) || mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor)}">\r
				<ActionReference Name="Offset" Y="1" />\r
				<ActionReference Name="Falling"/>\r
				<ActionReference Name="Bouncing" />\r
			</Action>\r
			<Action Type="Sequence" Condition="\${mascot.environment.workArea.leftBorder.isOn(mascot.anchor) || mascot.environment.activeIE.rightBorder.isOn(mascot.anchor)}">\r
				<ActionReference Name="Offset" X="1" />\r
				<ActionReference Name="Falling"/>\r
				<ActionReference Name="Bouncing" />\r
			</Action>\r
			<Action Type="Sequence" Condition="\${mascot.environment.workArea.rightBorder.isOn(mascot.anchor) || mascot.environment.activeIE.leftBorder.isOn(mascot.anchor)}">\r
				<ActionReference Name="Offset" X="-1" />\r
				<ActionReference Name="Falling"/>\r
				<ActionReference Name="Bouncing" />\r
			</Action>\r
			<Action Type="Select">\r
				<ActionReference Name="DashIeCeilingLeftEdgeFromJump"\r
					Condition="\${mascot.environment.activeIE.topBorder.isOn(mascot.anchor) &amp;&amp;\r
					mascot.anchor.x &lt; (mascot.environment.activeIE.left+mascot.environment.activeIE.right)/2}"/>\r
				<ActionReference Name="DashIeCeilingRightEdgeFromJump"\r
					Condition="\${mascot.environment.activeIE.topBorder.isOn(mascot.anchor) &amp;&amp;\r
					mascot.anchor.x &gt;= (mascot.environment.activeIE.left+mascot.environment.activeIE.right)/2}" />\r
			</Action>\r
			<ActionReference Name="Dash" TargetX="\${ mascot.anchor.x+(mascot.environment.cursor.x-mascot.anchor.x)*Math.random()/2 }" />\r
			<ActionReference Name="Tripping" Condition="\${Math.random() &lt; 0.05}" />\r
			<ActionReference Name="Dash" TargetX="\${ mascot.anchor.x+(mascot.environment.cursor.x-mascot.anchor.x)*Math.random() }" />\r
			<ActionReference Name="Tripping" Condition="\${Math.random() &lt; 0.05}" />\r
			<ActionReference Name="Dash" TargetX="#{mascot.environment.cursor.x+Gap}"\r
				Gap="\${ mascot.anchor.x &lt; mascot.environment.cursor.x ?\r
					-Math.min( mascot.environment.cursor.x-mascot.anchor.x, Math.random()*200) :\r
					Math.min( mascot.anchor.x-mascot.environment.cursor.x, Math.random()*200 ) }" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
		</Action>\r
\r
		<Action Name="SitAndFaceMouse" Type="Sequence" Loop="false">\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
			<ActionReference Name="SitAndLookAtMouse" Duration="\${10+Math.random()*10}" />\r
			<ActionReference Name="Look" LookRight="\${mascot.anchor.x &lt; mascot.environment.cursor.x}" />\r
		</Action>\r
		<Action Name="SitAndSpinHead" Type="Sequence" Loop="false">\r
			<ActionReference Name="SitAndSpinHeadAction" />\r
		</Action>\r
\r
		<Action Name="PullUpShimeji1" Type="Embedded" Class="com.group_finity.mascot.action.Breed"\r
			BornX="-32" BornY="96" BornBehavior="PullUp">\r
			<Animation>\r
				<Pose Image="/shime1.png" ImageAnchor="64,128" Velocity="0,0" Duration="16" />\r
				<Pose Image="/shime38.png" ImageAnchor="96,128" Velocity="0,0" Duration="4" />\r
				<Pose Image="/shime39.png" ImageAnchor="96,128" Velocity="0,0" Duration="40" />\r
				<Pose Image="/shime40.png" ImageAnchor="96,128" Velocity="0,0" Duration="40" />\r
				<Pose Image="/shime41.png" ImageAnchor="96,128" Velocity="0,0" Duration="40" />\r
			</Animation>\r
		</Action>\r
		<Action Name="PullUpShimeji2" Type="Animate">\r
			<Animation>\r
				<Pose Image="/shime9.png" ImageAnchor="32,128" Velocity="20,-20" Duration="1" />\r
				<Pose Image="/shime9.png" ImageAnchor="32,128" Velocity="20,-10" Duration="1" />\r
				<Pose Image="/shime9.png" ImageAnchor="32,128" Velocity="20,-5" Duration="1" />\r
			</Animation>\r
		</Action>\r
		<Action Name="PullUpShimeji" Type="Sequence">\r
			<ActionReference Name="PullUpShimeji1" />\r
			<ActionReference Name="PullUpShimeji2" />\r
			<ActionReference Name="Falling" InitialVX="\${mascot.lookRight ? -20 : 20}"/>\r
			<ActionReference Name="Bouncing" />\r
			<ActionReference Name="Sprawl" Duration="40" />\r
		</Action>\r
\r
		<Action Name="PullUp" Type="Sequence">\r
			<ActionReference Name="Falling" InitialVX="\${mascot.lookRight ? 10 : -10}" InitialVY="-40"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
		<Action Name="Divide1" Type="Embedded" Class="com.group_finity.mascot.action.Breed"\r
			BornX="-16" BornY="0" BornBehavior="Divided">\r
			<Animation>\r
				<Pose Image="/shime42.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime43.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime44.png" ImageAnchor="64,128" Velocity="0,0" Duration="2" />\r
				<Pose Image="/shime45.png" ImageAnchor="64,128" Velocity="0,0" Duration="5" />\r
				<Pose Image="/shime46.png" ImageAnchor="64,128" Velocity="0,0" Duration="20" />\r
			</Animation>\r
		</Action>\r
		<Action Name="SplitIntoTwo" Type="Sequence">\r
			<ActionReference Name="Divide1" />\r
			<ActionReference Name="Offset" X="16" />\r
			<ActionReference Name="Look" />\r
			<ActionReference Name="Divided" />\r
		</Action>\r
		<Action Name="Divided" Type="Sequence">\r
			<ActionReference Name="Falling" InitialVX="\${mascot.lookRight ? 10 : -10}" InitialVY="-5"/>\r
			<ActionReference Name="Bouncing" />\r
		</Action>\r
	</ActionList>\r
\r
</Mascot>\r
`, Ui = `\uFEFF<?xml version="1.0" encoding="UTF-8" ?>\r
<Mascot xmlns="http://www.group-finity.com/Mascot" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\r
	xsi:schemaLocation="http://www.group-finity.com/Mascot Mascot.xsd">\r
\r
	<BehaviorList>\r
	\r
		<!-- ALWAYS REQUIRED -->\r
		<Behavior Name="ChaseMouse" Frequency="0" Hidden="true">\r
			<NextBehavior Add="false">\r
				<BehaviorReference Name="SitAndFaceMouse" Frequency="1" />\r
			</NextBehavior>\r
		</Behavior>\r
		\r
		<Behavior Name="SitAndFaceMouse" Frequency="0">\r
			<NextBehavior Add="false">\r
				<BehaviorReference Name="SitAndFaceMouse" Frequency="100" />\r
				<BehaviorReference Name="SitAndSpinHead" Frequency="1" />\r
				<BehaviorReference Name="SitWhileDanglingLegs" Frequency="1" />\r
			</NextBehavior>\r
		</Behavior>\r
		\r
		<Behavior Name="SitAndSpinHead" Frequency="0">\r
			<NextBehavior Add="false">\r
				<BehaviorReference Name="SitAndFaceMouse" Frequency="1" />\r
			</NextBehavior>\r
		</Behavior>\r
		\r
		<!-- ALWAYS REQUIRED -->\r
		<Behavior Name="Fall" Frequency="0" Hidden="true" />\r
		\r
		<!-- ALWAYS REQUIRED -->\r
		<Behavior Name="Dragged" Frequency="0" Hidden="true" />\r
		\r
		<!-- ALWAYS REQUIRED -->\r
		<Behavior Name="Thrown" Frequency="0" Hidden="true" />\r
		\r
		<Behavior Name="PullUp" Frequency="0" Hidden="true" />\r
		<Behavior Name="Divided" Frequency="0" Hidden="true" />\r
\r
		<!-- On the Floor -->\r
		<Condition Condition="#{mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor)}">\r
			<Behavior Name="StandUp" Frequency="200" Hidden="true" />\r
			<Behavior Name="SitDown" Frequency="200">\r
				<NextBehavior Add="true">\r
					<BehaviorReference Name="SitWhileDanglingLegs" Frequency="100" />\r
					<BehaviorReference Name="LieDown" Frequency="100" />\r
				</NextBehavior>\r
			</Behavior>\r
			<Behavior Name="SitWhileDanglingLegs" Frequency="0" />\r
			<Behavior Name="LieDown" Frequency="0">\r
				<NextBehavior Add="false">\r
					<BehaviorReference Name="SitDown" Frequency="100" />\r
					<BehaviorReference Name="CrawlAlongIECeiling" Frequency="100" Condition="\${mascot.environment.activeIE.topBorder.isOn(mascot.anchor)}" Hidden="true" />\r
					<BehaviorReference Name="CrawlAlongWorkAreaFloor" Frequency="100" Condition="\${mascot.environment.floor.isOn(mascot.anchor)}" />\r
				</NextBehavior>\r
			</Behavior>\r
			\r
			<Behavior Name="SplitIntoTwo" Frequency="50" Condition="#{mascot.totalCount &lt; 50}" />\r
		</Condition>\r
\r
		<!-- On the Wall -->\r
		<Condition Condition="#{ mascot.lookRight ? (\r
					mascot.environment.workArea.rightBorder.isOn(mascot.anchor) || \r
					mascot.environment.activeIE.leftBorder.isOn(mascot.anchor) ) : (\r
					mascot.environment.workArea.leftBorder.isOn(mascot.anchor) || \r
					mascot.environment.activeIE.rightBorder.isOn(mascot.anchor) ) }">\r
			<Behavior Name="HoldOntoWall" Frequency="100" Hidden="true" />\r
			<Behavior Name="FallFromWall" Frequency="50" Condition="\${!mascot.environment.floor.isOn(mascot.anchor)}" Hidden="true" />\r
		</Condition>\r
		\r
		<!-- On the Ceiling -->\r
		<Condition Condition="#{mascot.environment.ceiling.isOn(mascot.anchor) || mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor)}">\r
			<Behavior Name="HoldOntoCeiling" Frequency="100" Hidden="true" />\r
			<Behavior Name="FallFromCeiling" Frequency="50" Hidden="true" />\r
		</Condition>\r
		\r
		<!-- On Work Area Floor -->\r
		<Condition Condition="#{mascot.environment.floor.isOn(mascot.anchor)}">\r
			<Behavior Name="WalkAlongWorkAreaFloor" Frequency="100" Hidden="true" />\r
			<Behavior Name="RunAlongWorkAreaFloor" Frequency="100" Hidden="true" />\r
			<Behavior Name="CrawlAlongWorkAreaFloor" Frequency="10">\r
				<NextBehavior Add="false">\r
					<!-- Finished Crawling -->\r
					<BehaviorReference Name="LieDown" Frequency="1" />\r
				</NextBehavior>\r
			</Behavior>\r
			<Behavior Name="WalkLeftAlongFloorAndSit" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkRightAlongFloorAndSit" Frequency="100" Hidden="true" />\r
			<Behavior Name="GrabWorkAreaBottomLeftWall" Frequency="100" Hidden="true" />\r
			<Behavior Name="GrabWorkAreaBottomRightWall" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkLeftAndSit" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkRightAndSit" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkAndGrabBottomLeftWall" Frequency="100" />\r
			<Behavior Name="WalkAndGrabBottomRightWall" Frequency="100" />\r
			<Behavior Name="JumpFromBottomOfIE" Frequency="50" Condition="#{mascot.anchor.x &gt;= mascot.environment.activeIE.left &amp;&amp;\r
				mascot.anchor.x &lt; mascot.environment.activeIE.right}" />\r
				\r
			<Behavior Name="PullUpShimeji" Frequency="50" Condition="#{mascot.totalCount &lt; 50}" />\r
		</Condition>\r
		\r
		<!-- On Work Area Facing the Wall -->\r
		<Condition Condition="#{mascot.lookRight ? mascot.environment.workArea.rightBorder.isOn(mascot.anchor) :\r
					mascot.environment.workArea.leftBorder.isOn(mascot.anchor)}">\r
			<Behavior Name="ClimbHalfwayAlongWall" Frequency="100" Hidden="true" />\r
			<Behavior Name="ClimbAlongWall" Frequency="100" />\r
		</Condition>\r
		\r
		<!-- On Work Area Top Facing -->\r
		<Condition Condition="#{mascot.environment.ceiling.isOn(mascot.anchor)}">\r
			<Behavior Name="ClimbAlongCeiling" Frequency="100" />\r
		</Condition>\r
		\r
		<!-- On Top of IE -->\r
		<Condition Condition="#{mascot.environment.activeIE.topBorder.isOn(mascot.anchor)}">\r
			<Behavior Name="WalkAlongIECeiling" Frequency="100" Hidden="true" />\r
			<Behavior Name="RunAlongIECeiling" Frequency="100" Hidden="true" />\r
			<Behavior Name="CrawlAlongIECeiling" Frequency="10" Hidden="true">\r
				<NextBehavior Add="false">\r
					<!-- Finished Crawling -->\r
					<BehaviorReference Name="LieDown" Frequency="1" />\r
				</NextBehavior>\r
			</Behavior>\r
			<Behavior Name="SitOnTheLeftEdgeOfIE" Frequency="100" Hidden="true" />\r
			<Behavior Name="SitOnTheRightEdgeOfIE" Frequency="100" Hidden="true" />\r
			<Behavior Name="JumpFromLeftEdgeOfIE" Frequency="100" Hidden="true" />\r
			<Behavior Name="JumpFromRightEdgeOfIE" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkLeftAlongIEAndSit" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkRightAlongIEAndSit" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkLeftAlongIEAndJump" Frequency="100" Hidden="true" />\r
			<Behavior Name="WalkRightAlongIEAndJump" Frequency="100" Hidden="true" />\r
		</Condition>\r
		\r
		<!-- On IE's Side -->\r
		<Condition Condition="#{mascot.lookRight ? mascot.environment.activeIE.leftBorder.isOn(mascot.anchor) :\r
					mascot.environment.activeIE.rightBorder.isOn(mascot.anchor)}">\r
			<Behavior Name="HoldOntoIEWall" Frequency="100" Hidden="true" />\r
			<Behavior Name="ClimbIEWall" Frequency="100" Hidden="true" />\r
			\r
		</Condition>\r
\r
		<!-- On the Bottom of IE -->\r
		<Condition Condition="#{mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor)}">\r
			<Behavior Name="ClimbIEBottom" Frequency="100" Hidden="true" />\r
			<Behavior Name="GrabIEBottomLeftWall" Frequency="100" Hidden="true" />\r
			<Behavior Name="GrabIEBottomRightWall" Frequency="100" Hidden="true" />\r
		</Condition>\r
		\r
		<Behavior Name="JumpFromLeftWall" Frequency="50" Condition="#{!mascot.environment.workArea.leftBorder.isOn(mascot.anchor) &amp;&amp;\r
			mascot.anchor.x &lt; mascot.environment.workArea.left+400 &amp;&amp;\r
			Math.abs(mascot.environment.workArea.bottom-mascot.anchor.y) &lt;mascot.environment.workArea.height/4}" Hidden="true" />\r
		<Behavior Name="JumpFromRightWall" Frequency="50" Condition="#{!mascot.environment.workArea.rightBorder.isOn(mascot.anchor) &amp;&amp;\r
			mascot.anchor.x &gt;= mascot.environment.workArea.right-400 &amp;&amp;\r
			Math.abs(mascot.environment.workArea.bottom-mascot.anchor.y) &lt;mascot.environment.workArea.height/4}" Hidden="true" />\r
\r
		<!-- IE Is Visible -->\r
		<Condition Condition="#{mascot.environment.activeIE.visible}">\r
			<Behavior Name="JumpOnIELeftWall" Frequency="50" Condition="#{mascot.anchor.x &lt; mascot.environment.activeIE.left &amp;&amp;\r
				Math.abs(mascot.environment.activeIE.bottom-mascot.anchor.y) &lt;mascot.environment.activeIE.height/4}" Hidden="true" />\r
			<Behavior Name="JumpOnIERightWall" Frequency="50" Condition="#{mascot.anchor.x &gt; mascot.environment.activeIE.right &amp;&amp;\r
				Math.abs(mascot.environment.activeIE.bottom-mascot.anchor.y) &lt;mascot.environment.activeIE.height/4}" Hidden="true" />\r
				\r
			<Behavior Name="ThrowIEFromLeft" Frequency="20" Condition="#{mascot.environment.activeIE.bottom &lt; mascot.anchor.y-64 &amp;&amp;\r
				mascot.anchor.x &lt; mascot.environment.activeIE.left}" />\r
			<Behavior Name="ThrowIEFromRight" Frequency="20" Condition="#{mascot.environment.activeIE.bottom &lt; mascot.anchor.y-64 &amp;&amp;\r
				mascot.anchor.x &gt; mascot.environment.activeIE.right}" />\r
			<Behavior Name="WalkAndThrowIEFromRight" Frequency="20" Condition="#{mascot.environment.activeIE.bottom &lt; mascot.anchor.y-64 &amp;&amp;\r
				mascot.anchor.x &lt; mascot.environment.activeIE.left}" />\r
			<Behavior Name="WalkAndThrowIEFromLeft" Frequency="20" Condition="#{mascot.environment.activeIE.bottom &lt; mascot.anchor.y-64 &amp;&amp;\r
				mascot.anchor.x &gt; mascot.environment.activeIE.right}" />\r
		</Condition>\r
\r
	</BehaviorList>\r
</Mascot>\r
`, ji = ["actions.xml", "動作.xml", "action.xml", "one.xml", "1.xml"], zi = ["behaviors.xml", "行動.xml", "behavior.xml", "two.xml", "2.xml"], ht = /* @__PURE__ */ new Set([
  "img",
  "conf",
  "shimeji",
  "shimeji-ee",
  "shimejiee",
  "unused",
  "src",
  "sound",
  "bin",
  "",
  ".",
  ".."
]);
function je(r) {
  return r.replace(/\\/g, "/").replace(/^\/+/, "");
}
function z(r) {
  const e = je(r), t = e.lastIndexOf("/");
  return t >= 0 ? e.slice(t + 1) : e;
}
function Ji(r) {
  const e = je(r), t = e.lastIndexOf("/");
  return t >= 0 ? e.slice(0, t) : "";
}
function Xe(r) {
  let e = r.replace(/^[/\\]+/, "").trim();
  return e.toLowerCase().startsWith("img/") && (e = e.slice(4).replace(/^[/\\]+/, "")), /\.(png|gif|webp)$/i.test(e) || (e += ".png"), e.toLowerCase();
}
function Fe(r, e) {
  if (e)
    try {
      return new TextDecoder(e).decode(r);
    } catch {
    }
  try {
    return new TextDecoder("utf-8", { fatal: !0 }).decode(r);
  } catch {
    try {
      return new TextDecoder("shift-jis").decode(r);
    } catch {
      return new TextDecoder("utf-8").decode(r);
    }
  }
}
function Gi(r) {
  const e = /* @__PURE__ */ new Set(), i = he(r).replace(/xmlns=".*?"/g, "");
  try {
    const o = new DOMParser().parseFromString(i, "text/xml"), s = Array.from(o.getElementsByTagName("Pose"));
    for (const a of s) {
      const c = a.getAttribute("Image") || a.getAttribute("ImageRight");
      c && e.add(c.trim());
    }
  } catch {
    const n = i.matchAll(/(?:Image|ImageRight)=["']([^"']+)["']/g);
    for (const o of n)
      o[1] && e.add(o[1].trim());
  }
  return e;
}
class pn {
  /**
   * Parse a mascot archive from various input sources.
   */
  static async analyze(e, t) {
    const i = [], n = (v) => {
      i.push(v), t != null && t.onWarning ? t.onWarning(v) : console.warn(`[ShimejiFinder] ${v.message}`);
    };
    let o;
    if (typeof e == "string") {
      const v = await fetch(e);
      if (!v.ok)
        throw new Error(`[ShimejiFinder] Failed to fetch mascot pack from URL: ${e} (${v.status})`);
      const b = await v.arrayBuffer();
      o = new Uint8Array(b);
    } else if (typeof Blob < "u" && (e instanceof Blob || e && typeof e.arrayBuffer == "function" && !(e instanceof ArrayBuffer))) {
      const v = await e.arrayBuffer();
      o = new Uint8Array(v);
    } else if (ArrayBuffer.isView(e))
      o = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
    else if (e instanceof ArrayBuffer || e && Object.prototype.toString.call(e) === "[object ArrayBuffer]")
      o = new Uint8Array(e);
    else
      throw new Error("[ShimejiFinder] Invalid input source type");
    let s;
    try {
      s = Yi(o);
    } catch (v) {
      throw new Error(`[ShimejiFinder] Failed to decompress archive: ${v instanceof Error ? v.message : String(v)}`);
    }
    const a = /* @__PURE__ */ new Map();
    for (const [v, b] of Object.entries(s)) {
      if (v.endsWith("/")) continue;
      const p = je(v);
      a.set(p, b);
    }
    let c = null, u = null, h = "";
    for (const [v] of a.entries()) {
      const b = z(v).toLowerCase();
      ji.includes(b) && !c && (c = v), zi.includes(b) && !u && (u = v);
    }
    let l = t == null ? void 0 : t.name;
    if (!l && c) {
      h = Ji(c);
      const v = h.split("/").filter(Boolean);
      for (let b = v.length - 1; b >= 0; b--) {
        const p = v[b].toLowerCase();
        if (!ht.has(p)) {
          l = v[b];
          break;
        }
      }
    }
    if (!l)
      for (const v of a.keys()) {
        const b = v.match(/(?:^|\/)(?:img|characters)\/([^/]+)\//i);
        if (b && b[1]) {
          const p = b[1];
          if (!["unused", "conf", "img", "src", "bin"].includes(p.toLowerCase())) {
            l = p;
            break;
          }
        }
      }
    if (!l)
      if (typeof e == "string") {
        const v = z(e.split("?")[0]).replace(/\.[^/.]+$/, "");
        v && !ht.has(v.toLowerCase()) && (l = v);
      } else typeof File < "u" && e instanceof File && e.name && (l = e.name.replace(/\.[^/.]+$/, ""));
    l || (l = "CustomMascot");
    const d = /* @__PURE__ */ new Map();
    let y = "", A = "", g;
    for (const [v, b] of a.entries())
      if (z(v).toLowerCase() === "info.json") {
        try {
          const p = Fe(b, t == null ? void 0 : t.encoding);
          g = JSON.parse(p);
        } catch {
        }
        break;
      }
    if (c && u) {
      const v = a.get(c), b = a.get(u);
      y = he(Fe(v, t == null ? void 0 : t.encoding)), A = he(Fe(b, t == null ? void 0 : t.encoding));
      const p = Gi(y);
      for (const I of p) {
        const k = z(I).toLowerCase(), x = Xe(I);
        let S;
        for (const [R, N] of a.entries()) {
          const Y = z(R).toLowerCase();
          if (Y === k || Y === x) {
            S = N;
            break;
          }
        }
        if (S) {
          const R = new Blob([S], { type: "image/png" }), N = URL.createObjectURL(R);
          d.set(x, N), d.set(I, N), d.set(k, N);
        } else
          n({
            type: "missing_sprite",
            message: `Sprite referenced in XML but not found in archive: "${I}"`,
            data: { image: I }
          });
      }
      for (const [I, k] of a.entries()) {
        const x = z(I).toLowerCase();
        if (x.endsWith(".png")) {
          const S = Xe(x);
          if (!d.has(S)) {
            const R = new Blob([k], { type: "image/png" }), N = URL.createObjectURL(R);
            d.set(S, N), d.set(x, N);
          }
        }
      }
    } else {
      const v = /* @__PURE__ */ new Map();
      let b = !1;
      for (const [p, I] of a.entries()) {
        const x = z(p).toLowerCase().match(/^shime(\d+)\.png$/);
        if (x) {
          const S = parseInt(x[1], 10);
          S === 47 && (b = !0), v.set(S, I);
        }
      }
      if (v.size >= 46 && !b) {
        y = Hi, A = Ui;
        for (let p = 1; p <= 46; p++) {
          const I = v.get(p);
          if (I) {
            const k = new Blob([I], { type: "image/png" }), x = URL.createObjectURL(k), S = `shime${p}.png`;
            d.set(S, x), d.set(`/shime${p}.png`, x);
          }
        }
      } else
        throw new Error(
          "[ShimejiFinder] Could not find valid Shimeji configurations (actions.xml/behaviors.xml) or a complete 46-frame sprite set in the archive."
        );
    }
    return {
      name: l,
      actionsXml: y,
      behaviorsXml: A,
      sprites: d,
      meta: g,
      warnings: i
    };
  }
}
const Ki = ki("engine"), lt = /* @__PURE__ */ new Set(), mt = /* @__PURE__ */ new Set(), Qi = 200, Zi = 4, _i = 250, Mt = {
  tickMs: 40,
  gravity: 2,
  resistanceX: 0.05,
  resistanceY: 0.1,
  stayDurationTicks: 250,
  dragResistTicks: 250,
  dragResistAbortPx: 5,
  dragOffsetX: 0,
  dragOffsetY: 120,
  broadcastServeTimeoutTicks: 600,
  suspectStepPx: 24
};
let T = { ...Mt };
function $t(r, e, t) {
  for (const i of r.poses ?? []) i.image && e.add(t(i.image));
  for (const i of r.animations ?? [])
    for (const n of i.poses) n.image && e.add(t(n.image));
  for (const i of r.children ?? []) $t(i, e, t);
}
function en(r) {
  const e = { ...T }, t = {
    tickMs: [1, 1e3],
    gravity: [-1e3, 1e3],
    resistanceX: [0, 1],
    resistanceY: [0, 1],
    stayDurationTicks: [1, 1e6],
    dragResistTicks: [1, 1e6],
    dragResistAbortPx: [0, 1e5],
    dragOffsetX: [-1e5, 1e5],
    dragOffsetY: [-1e5, 1e5],
    broadcastServeTimeoutTicks: [1, 1e6],
    suspectStepPx: [0, 1e5]
  };
  if (!r) return e;
  for (const i of Object.keys(Mt)) {
    const n = r[i];
    if (typeof n == "number" && Number.isFinite(n)) {
      const [o, s] = t[i];
      e[i] = Math.min(s, Math.max(o, n));
    }
  }
  return e;
}
const tn = 150, X = 128, re = "*", nn = 80, rn = 1.25, on = 260, ut = 12, sn = 6, an = 400, cn = 20, ve = 200, hn = 200, f = class f {
  constructor(e, t) {
    /** Stable per-session identity, used to name this mascot's log file. */
    m(this, "id");
    m(this, "label");
    m(this, "container");
    m(this, "mascotName");
    /** This pack's resolved base URL, captured at construction so `configure()`
     *  after the fact cannot leave one mascot reading from another pack. */
    m(this, "packBaseUrl");
    m(this, "config", null);
    m(this, "elRoot");
    m(this, "elImg");
    /** An Interact action with image-less hold frames must hide its old standalone frame. */
    m(this, "interactionVisualActive", !1);
    m(this, "actionStack", []);
    m(this, "currentBehavior", null);
    m(this, "behaviorUsability", /* @__PURE__ */ new Map());
    /** Whether a behaviour's action needs a partner, cached per behaviour name. */
    m(this, "partnerCache", /* @__PURE__ */ new Map());
    /** Whether a behaviour's action can move the mascot, cached per behaviour name. */
    m(this, "travelCache", /* @__PURE__ */ new Map());
    /** The border a behaviour starts on, cached per behaviour name. */
    m(this, "borderStartCache", /* @__PURE__ */ new Map());
    m(this, "tickCount", 0);
    /** Anchor at the previous logic tick, used to interpolate the sub-steps. */
    m(this, "prevX", 0);
    m(this, "prevY", 0);
    m(this, "isDragging", !1);
    /** Ticks the cursor has been motionless while the mascot is held
     *  (libshijima dragged::init's `time_to_resist` timer). */
    m(this, "dragStillTicks", 0);
    /** Timestamp of the last swallowed tick error, so it is reported at most once a
     *  second instead of flooding the observation log. */
    m(this, "lastTickErrorAt", 0);
    m(this, "lastTime", 0);
    m(this, "accumulator", 0);
    m(this, "loopId", 0);
    m(this, "pauseReasons", /* @__PURE__ */ new Set());
    m(this, "unregisterPage", null);
    m(this, "lastScrollY", 0);
    /** Camera translation in sprite units, separate from physical velocity. */
    m(this, "pendingScrollShift", 0);
    m(this, "scrollDetachPending", null);
    m(this, "lastDocumentScrollAt", null);
    /** A landing consumes the current scroll, but fresh user input can detach again. */
    m(this, "scrollFloorBlocked", !1);
    m(this, "scrollFallRoot", null);
    m(this, "scrollFallHeight", 0);
    m(this, "lastSurface", null);
    m(this, "scrollSquashEnabled", !1);
    m(this, "squashAmount", 0);
    m(this, "cursorX", 0);
    m(this, "cursorY", 0);
    /** Cursor movement during the last logic tick, i.e. `environment.cursor.dx/dy`.
     *  libshijima rolls the raw per-subtick deltas over one tick; the packs use this
     *  as the throw velocity (`Thrown`: InitialVX/InitialVY), so it must be a per-tick
     *  delta — a per-mousemove delta makes a synthetic pointer jump launch the mascot
     *  across the screen (caught by the position-jump suspect). */
    m(this, "cursorTickDX", 0);
    m(this, "cursorTickDY", 0);
    m(this, "lastTickCursorX", 0);
    m(this, "lastTickCursorY", 0);
    /** Velocity at the start of the tick, so the jump detector can tell physics from
     *  a bug even when the phase ended and zeroed the velocity during the tick. */
    m(this, "tickStartVX", 0);
    m(this, "tickStartVY", 0);
    /** libshijima dragged::init/subtick(): the smoothed x the held mascot dangles
     *  from. The pack's own Pinched action reads it to choose its pose. */
    m(this, "footX", 0);
    m(this, "footDX", 0);
    /**
     * Qt `state::local_cursor` (see `state::get_raw_cursor()`): while the mascot is
     * held, the cursor the simulation reads is the pointer *plus this drag's grab
     * offset*, seeded when the drag starts so that `anchor = cursor + OffsetX/OffsetY`
     * reproduces the anchor the mascot had when it was picked up. Without it the first
     * held tick snaps the mascot to the pack's fixed hold point — measured 108 px for a
     * grab 12 px above the feet — because the old code kept only the *fixed* offsets.
     * `null` means "no drag in progress, the pointer is the cursor".
     */
    m(this, "dragGrab", null);
    /** Anchor and pointer at mousedown, in virtual units, so the grab offset can be
     *  derived on the first held tick — which is when the action's own OffsetX/OffsetY
     *  (the values Qt seeds the local cursor from) are known. */
    m(this, "dragPressAnchorX", 0);
    m(this, "dragPressAnchorY", 0);
    m(this, "dragPressCursorX", 0);
    m(this, "dragPressCursorY", 0);
    /**
     * Press bookkeeping for the hotspot gesture (HOLD_TRIGGER_MS …). A press is
     * tracked until the button is released, because which gesture it is (hold, click or
     * pickup) is only decided by how long and how far the pointer moved.
     */
    m(this, "pressActive", !1);
    /** Active pointer ID for the current press/drag session to isolate touches in multi-touch environments. */
    m(this, "activePointerId", null);
    m(this, "pressStartAt", 0);
    m(this, "pressClientX", 0);
    m(this, "pressClientY", 0);
    /** Largest Manhattan distance the pointer travelled during this press. */
    m(this, "pressMaxMovement", 0);
    /** The hotspot the press landed on, while it can still become a hold or a click. */
    m(this, "hotspotHold", null);
    m(this, "hotspotHoldTriggered", !1);
    /** Buttons currently held, as reported by the last pointer event. Qt queries
     *  `QGuiApplication::mouseButtons()` per tick so a release that never arrives
     *  cannot leave a press or a drag stuck; this is the DOM's equivalent. */
    m(this, "cursorButtons", 0);
    /** Offscreen copy of the frame the mascot is showing, for the opaque-pixel hit
     *  test (`ShijimaWidget::pointInside`). Re-read whenever the image changes. */
    m(this, "alphaCanvas", null);
    m(this, "alphaData", null);
    m(this, "alphaSrc", "");
    /** Cached host-CSS offset between this engine's coordinates and the drawn anchor
     *  (see `hostShift()`); refreshed at most once per logic tick. */
    m(this, "hostShiftCache", { x: 0, y: 0, tick: -1 });
    /** Change detection for the observation stream. */
    m(this, "observedPath", "");
    m(this, "observedImage", "");
    m(this, "eventsAbortController", new AbortController());
    /**
     * One-shot timers from `init()` and `setVisible()` can fire
     * after `destroy()`, which used to let a torn-down mascot poke at a detached DOM
     * node (and at `this.visible`, which no longer means anything).
     */
    m(this, "pendingTimers", /* @__PURE__ */ new Set());
    m(this, "destroyed", !1);
    /** Set for the tick on which an Offset action moved the anchor on purpose. */
    m(this, "offsetJumped", !1);
    /** How long the current behaviour has been running, for the hard cap. */
    m(this, "behaviorTicks", 0);
    m(this, "behaviorInstance", 0);
    m(this, "pendingScan", null);
    /** Consecutive ticks the anchor has not moved, for the "standing still" pacer. */
    m(this, "stillTicks", 0);
    /** Same, but only reset by real movement: it is what guarantees a lively page. */
    m(this, "anchorStillTicks", 0);
    /** Set once the mascot has been in the same spot too long: the next pick must travel. */
    m(this, "wantMovement", !1);
    /** Tick until which partner behaviours stay out of the pool (see the config's
     *  `interactionCooldownTicks`); refreshed while an interaction is running. */
    m(this, "interactionCooldownUntil", 0);
    /** Behaviours initialised in the current tick, for the runaway guard. */
    m(this, "behaviorInitsThisTick", 0);
    m(this, "actionExpansionsThisTick", 0);
    /** Affordance state (see Broadcast.ts). Advertisements and scan links belong to
     *  the action instance and live on its frame; the handshake belongs to the
     *  mascot, because its behaviour is what the partner is waiting on. */
    m(this, "interaction", new qe());
    /** Tick at which this mascot first noticed that its advertisement had been
     *  claimed, or 0 when it is not holding a pose for anybody (see
     *  runtime.broadcastServeTimeoutTicks). */
    m(this, "servingClaimSince", 0);
    /** Paused while the mascot's container is scrolled out of view. */
    m(this, "visible", !0);
    m(this, "intersectionObserver", null);
    m(this, "x", 0);
    m(this, "y", 0);
    m(this, "vx", 0);
    m(this, "vy", 0);
    m(this, "lookRight", !0);
    /** Position of the last frame actually handed to CSS, including interpolation. */
    m(this, "lastRenderedX", 0);
    m(this, "lastRenderedY", 0);
    m(this, "lastRenderedPose", null);
    this.container = e, this.mascotName = t, this.packBaseUrl = `${f.packBaseUrl}/${t}`, this.id = f.nextId++, this.label = `${this.id}-${t}`, this.elRoot = document.createElement("div"), Object.assign(this.elRoot.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      pointerEvents: "none",
      cursor: "grab",
      zIndex: "1",
      userSelect: "none",
      visibility: "hidden",
      touchAction: "none",
      // A definite box as well: the root carries a transform and nothing else, so
      // without this it has a zero-size hit box and is invisible to hit testing.
      width: `${X}px`,
      height: `${X}px`
    }), this.elImg = document.createElement("img"), this.elImg.style.position = "absolute", this.elImg.style.visibility = "hidden", this.elImg.style.pointerEvents = "auto", this.elImg.style.cursor = "inherit", this.elImg.style.touchAction = "none", this.elImg.ondragstart = () => !1, this.elImg.style.maxWidth = "none", this.elImg.style.maxHeight = "none", this.elImg.addEventListener("load", () => {
      this.applySpriteIntrinsicSize(), this.elImg.style.visibility = "visible";
    }), this.elImg.style.width = `${X}px`, this.elImg.style.height = `${X}px`, this.elRoot.appendChild(this.elImg), this.bindEvents(), f.installGlobalEvents();
  }
  handleExternalScroll(e, t = !0) {
    if (this.destroyed || this.isDragging || this.pauseReasons.size > 0 || !Number.isFinite(e) || e === 0)
      return;
    const i = this.surfaceAt();
    if (t) {
      if (this.documentScrollActive() || (this.scrollFloorBlocked = !1), this.lastDocumentScrollAt = performance.now(), this.scrollFloorBlocked && i === "floor" && e > 0) return;
      this.pendingScrollShift += e / this.spriteScale;
    }
    i === "floor" && t && e > 0 || i === "left-wall" || i === "right-wall" || i === "ceiling" ? this.scrollDetachPending = i : i === "floor" && e < 0 && this.scrollDetachPending === "floor" && (this.scrollDetachPending = null);
  }
  documentScrollActive() {
    return this.lastDocumentScrollAt !== null && performance.now() - this.lastDocumentScrollAt < Qi;
  }
  protectScrollLanding() {
    this.scrollFloorBlocked = this.documentScrollActive();
  }
  /**
   * A landing is not "stood still for a while".
   *
   * `stillTicks` is advanced by *net displacement*, and a mascot that is carried by
   * the page (or pinned to the floor while the document scrolls) barely displaces,
   * so it could reach the pacer threshold without ever deciding to stand around.
   * The first pick after such a landing was then forced to be a travelling
   * behaviour — the "it just fell and immediately ran off" report. Resetting here
   * makes the pacer measure stillness the mascot actually chose, and drops any
   * pending "must travel" intent from before the fall.
   */
  settleAfterLanding() {
    this.stillTicks = 0, this.anchorStillTicks = 0, this.wantMovement = !1;
  }
  /** Keep partner behaviours out of the pool for a moment after a scroll landing. */
  graceAfterScrollLanding() {
    this.interactionCooldownUntil = Math.max(
      this.interactionCooldownUntil,
      this.tickCount + _i
    );
  }
  isScrollStartContact() {
    return this.scrollFallRoot === this.actionStack[0] && this.scrollFallHeight < Zi && this.documentScrollActive();
  }
  setClickThrough(e) {
    this.elRoot && (this.elRoot.style.pointerEvents = "none"), this.elImg && (this.elImg.style.pointerEvents = e ? "none" : "auto");
  }
  setScrollSquash(e) {
    this.scrollSquashEnabled = e, e || (this.squashAmount = 0);
  }
  getScrollSquash() {
    return this.scrollSquashEnabled;
  }
  resetToSpawn(e) {
    this.endDrag(), this.interaction.finalize(), this.actionStack = [], this.vx = 0, this.vy = 0, this.applySpawnPosition(e), this.resetScrollTracking(), this.setBehavior("Fall", "manual-reset"), this.actionExpansionsThisTick = 0, this.prevX = this.x, this.prevY = this.y, this.renderNow();
  }
  pauseForRelay() {
    Number.isFinite(this.lastRenderedX) && Number.isFinite(this.lastRenderedY) && (this.x = this.lastRenderedX, this.y = this.lastRenderedY), this.cancelPress(), this.isDragging && this.releaseDrag("relay-release"), this.prevX = this.x, this.prevY = this.y, this.accumulator = 0, this.render(!1), this.setPauseReason("relay-transfer", !0);
  }
  /** Resume an engine that was paused while its relay snapshot was handed off. */
  resumeForRelay() {
    this.renderNow(), this.elRoot.style.visibility = "visible", this.setPauseReason("relay-transfer", !1);
  }
  /** Paint the current logical state without advancing simulation time. */
  renderNow() {
    this.destroyed || this.render(!1);
  }
  createRelaySnapshot() {
    var a, c, u;
    const e = this.area(), t = this.lastRenderedPose, i = this.surfaceAt(), n = this.currentBehavior && ((a = this.config) == null ? void 0 : a.actions[this.currentBehavior.name]), o = this.interaction.available || this.actionStack.some((h) => !!h.server || !!h.client) || !!n && this.actionTreeMatches(
      n,
      (h) => {
        var l;
        return this.isScanMove(h) || this.isInteract(h) || !!((l = h.attributes) != null && l.Affordance);
      }
    ), s = {
      schemaVersion: 2,
      pack: this.mascotName,
      x: this.lastRenderedX,
      y: this.lastRenderedY,
      area: { ...e },
      anchorX: i && this.borderIsOn("left", { x: this.x, y: this.y }) ? "left" : i && this.borderIsOn("right", { x: this.x, y: this.y }) ? "right" : "free",
      anchorY: i === "floor" ? "floor" : i === "ceiling" ? "ceiling" : "free",
      interaction: o,
      vx: this.vx,
      vy: this.vy,
      lookRight: this.lookRight,
      behaviorName: ((c = this.currentBehavior) == null ? void 0 : c.name) ?? "StandUp",
      behaviorId: (u = this.currentBehavior) == null ? void 0 : u.id,
      behaviorTicks: this.behaviorTicks,
      stillTicks: this.stillTicks,
      anchorStillTicks: this.anchorStillTicks,
      frames: this.actionStack.map((h) => {
        var l;
        return {
          parentIndex: h.parentIndex,
          referenceDepth: h.referenceDepth,
          nodeType: h.node.type,
          nodeName: h.node.name,
          nodeClassName: h.node.className,
          childIndex: h.childIndex,
          vars: { ...h.vars },
          resolved: { ...h.resolved },
          conditions: { ...h.conditions },
          poseDurations: h.poseDurations ? [...h.poseDurations] : void 0,
          elapsed: h.elapsed,
          poseIndex: h.poseIndex,
          poseTick: h.poseTick,
          animationIndex: ((l = h.node.animations) == null ? void 0 : l.indexOf(h.animation)) ?? -1,
          stallTicks: h.stallTicks,
          progressX: h.progressX,
          progressY: h.progressY,
          durationLimit: h.durationLimit,
          finishCycle: h.finishCycle
        };
      })
    };
    if (this.elImg.style.visibility !== "hidden" && this.elImg.getAttribute("src") && t) {
      const h = this.elImg.getAttribute("src").slice((this.packBaseUrl + "/img").length);
      s.visual = {
        image: h,
        imageAnchor: { ...t.imageAnchor },
        lookRight: this.lookRight,
        screenX: s.x * this.spriteScale,
        screenY: s.y * this.spriteScale,
        scale: this.spriteScale,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    }
    return s;
  }
  /** Prepare a reused engine behind its placeholder. Simulation stays paused. */
  async prepareForRelay(e) {
    this.setPauseReason("relay-transfer", !0), this.elRoot.style.visibility = "hidden", this.restoreRelaySnapshot(e) || this.resetForRelay(), await this.warmFirstPose(), this.destroyed || this.render(!1);
  }
  /** One surface-aware fallback for invalid actions and terminated interactions. */
  resetForRelay() {
    this.releaseStack(), this.interaction.finalize(), this.cancelPress(), this.endDrag(), this.vx = 0, this.vy = 0;
    const e = this.surfaceAt(), t = e === "floor" ? "StandUp" : e === "ceiling" ? "HoldOntoCeiling" : e === "left-wall" || e === "right-wall" ? "HoldOntoWall" : "Fall";
    this.setBehavior(t, "relay-reset"), this.actionExpansionsThisTick = 0, this.advanceActionTree(), this.prevX = this.x, this.prevY = this.y, this.accumulator = 0;
  }
  restoreRelaySnapshot(e) {
    var c, u, h, l, d, y;
    if (!this.config || e.schemaVersion !== 2 || e.pack !== this.mascotName)
      return !1;
    const t = e.area;
    if (!t || ![
      e.x,
      e.y,
      e.vx,
      e.vy,
      t.left,
      t.top,
      t.right,
      t.bottom
    ].every(Number.isFinite) || t.right <= t.left || t.bottom <= t.top)
      return !1;
    const i = this.area(), n = fi(e, i), o = this.config.behaviors.find(
      (A) => A.name === e.behaviorName && (e.behaviorId === void 0 || A.id === e.behaviorId)
    ), s = [];
    let a = !!o && Array.isArray(e.frames) && e.frames.length > 0 && [
      e.behaviorTicks,
      e.stillTicks,
      e.anchorStillTicks
    ].every((A) => Number.isInteger(A) && A >= 0);
    if (a)
      for (const [A, g] of e.frames.entries()) {
        let v = A === 0 ? this.config.actions[o.name] : (c = s[A - 1].node.children) == null ? void 0 : c[g.parentIndex];
        if (!Number.isInteger(g.parentIndex) || !Number.isInteger(g.referenceDepth) || g.referenceDepth < 0 || g.referenceDepth > ve || ![
          g.childIndex,
          g.elapsed,
          g.poseIndex,
          g.poseTick,
          g.stallTicks
        ].every((k) => Number.isInteger(k) && k >= 0) || !g.vars || !g.resolved) {
          a = !1;
          break;
        }
        for (let k = 0; k < g.referenceDepth && v; k++)
          v = v.type === "ActionReference" ? this.config.actions[v.referenceName || ""] : void 0;
        if (!v || v.type !== g.nodeType || v.name !== g.nodeName || v.className !== g.nodeClassName) {
          a = !1;
          break;
        }
        const b = ((h = (u = v.animations) == null ? void 0 : u[g.animationIndex]) == null ? void 0 : h.poses) ?? v.poses;
        if (g.durationLimit !== null && (!Number.isFinite(g.durationLimit) || g.durationLimit < 0) || g.finishCycle !== void 0 && typeof g.finishCycle != "boolean" || g.conditions !== void 0 && (typeof g.conditions != "object" || g.conditions === null || Object.values(g.conditions).some((k) => typeof k != "boolean")) || g.poseDurations !== void 0 && (!Array.isArray(g.poseDurations) || g.poseDurations.length !== (b == null ? void 0 : b.length) || g.poseDurations.some((k) => !Number.isInteger(k) || k < 1)) || v.children && g.childIndex > v.children.length || b != null && b.length && g.poseIndex >= b.length || g.animationIndex !== -1 && !((l = v.animations) != null && l[g.animationIndex])) {
          a = !1;
          break;
        }
        const p = { ...g.resolved }, I = Tt(
          typeof p.TargetX == "number" ? p.TargetX : t.left,
          typeof p.TargetY == "number" ? p.TargetY : t.top,
          t,
          i
        );
        typeof p.TargetX == "number" && (p.TargetX = I.x), typeof p.TargetY == "number" && (p.TargetY = I.y), s.push({
          node: v,
          parentIndex: g.parentIndex,
          referenceDepth: g.referenceDepth,
          childIndex: g.childIndex,
          vars: { ...g.vars },
          resolved: p,
          live: {},
          liveTick: -1,
          conditions: { ...g.conditions },
          poseDurations: g.poseDurations ? [...g.poseDurations] : void 0,
          durationLimit: g.durationLimit,
          finishCycle: g.finishCycle ?? !1,
          elapsed: g.elapsed,
          poseIndex: g.poseIndex,
          poseTick: g.poseTick,
          stallTicks: g.stallTicks,
          progressX: NaN,
          progressY: NaN,
          server: null,
          client: null,
          animation: (d = v.animations) == null ? void 0 : d[g.animationIndex],
          bornTick: this.tickCount
        });
      }
    if (this.releaseStack(), this.interaction.finalize(), this.cancelPress(), this.endDrag(), this.resetScrollTracking(), this.x = n.x, this.y = n.y, this.lookRight = e.lookRight, this.currentBehavior = o ?? null, this.actionStack = s, this.interactionVisualActive = !1, this.servingClaimSince = 0, this.wantMovement = !1, this.behaviorUsability.clear(), !a || e.interaction ? (this.interactionCooldownUntil = this.tickCount + f.animationConfig.interactionCooldown(this.mascotName), this.resetForRelay()) : (this.vx = e.vx, this.vy = e.vy, this.behaviorTicks = e.behaviorTicks, this.stillTicks = e.stillTicks, this.anchorStillTicks = e.anchorStillTicks), this.constrainToWorkArea(), this.prevX = this.x, this.prevY = this.y, this.accumulator = 0, this.lastTime = performance.now(), a && !e.interaction && !((y = this.currentPose()) != null && y.image) && e.visual) {
      const A = e.visual;
      this.elImg.src = this.spriteUrl(A.image);
      const g = A.lookRight ? -1 : 1;
      this.elImg.style.transform = `translate(${-g * A.imageAnchor.x * this.spriteScale}px, ${-A.imageAnchor.y * this.spriteScale}px) scaleX(${g * this.spriteScale}) scaleY(${this.spriteScale})`, this.lastRenderedPose = {
        image: A.image,
        imageAnchor: { ...A.imageAnchor },
        velocity: { x: 0, y: 0 },
        duration: 1
      };
    }
    return this.render(!1), !0;
  }
  static addObserver(e) {
    return f.observers.add(e), () => {
      f.observers.delete(e);
    };
  }
  /** One page-level dispatcher handles events for all mascots. */
  static installGlobalEvents() {
    if (f.globalEventsInstalled || typeof window > "u")
      return;
    f.globalEventsInstalled = !0;
    const e = () => {
      for (const t of f.liveEngines) t.scrollFloorBlocked = !1;
    };
    window.addEventListener("wheel", (t) => {
      !t.ctrlKey && t.deltaY !== 0 && e();
    }, { capture: !0, passive: !0 }), window.addEventListener("touchmove", e, { capture: !0, passive: !0 }), window.addEventListener("pointerdown", (t) => {
      t.button === 0 && e();
    }, { capture: !0, passive: !0 }), window.addEventListener("keydown", (t) => {
      const i = t.target;
      t.ctrlKey || t.altKey || t.metaKey || i != null && i.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes((i == null ? void 0 : i.tagName) ?? "") || ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(t.key) && e();
    }, { capture: !0 }), window.addEventListener("pointermove", (t) => {
      t.buttons & 1 && t.pointerType !== "touch" && e();
      for (const i of f.liveEngines)
        if (i.pressActive) {
          if (i.activePointerId !== null && i.activePointerId !== t.pointerId)
            continue;
          i.cursorX = t.clientX, i.cursorY = t.clientY, i.cursorButtons = t.buttons, t.buttons & 1 ? (i.updatePressMovement(), i.isDragging && i.applyDragAnchor()) : i.finishPress(t.clientX, t.clientY);
        } else i.isDragging || (t.pointerType ?? "mouse") !== "touch" && (i.cursorX = t.clientX, i.cursorY = t.clientY, i.cursorButtons = t.buttons, i.elRoot.style.cursor = i.hotspotUnderCursor(
          t.clientX,
          t.clientY
        ) ? "pointer" : "grab");
    }), window.addEventListener("pointerup", (t) => {
      for (const i of f.liveEngines)
        i.activePointerId !== null && i.activePointerId !== t.pointerId || (i.cursorButtons = t.buttons, i.pressActive && i.finishPress(t.clientX, t.clientY));
    }), window.addEventListener("pointercancel", (t) => {
      for (const i of f.liveEngines)
        i.activePointerId !== null && i.activePointerId !== t.pointerId || (i.cursorButtons = 0, i.isDragging && i.releaseDrag("drag-release"), i.cancelPress());
    }), document.addEventListener("visibilitychange", () => {
      for (const t of f.liveEngines)
        document.hidden ? (t.isDragging && t.releaseDrag("drag-release"), t.cancelPress(), t.setPauseReason("hidden", !0)) : t.setPauseReason("hidden", !1);
    }), window.addEventListener("resize", () => {
      for (const t of f.liveEngines)
        t.partnerCache.clear(), t.travelCache.clear(), t.borderStartCache.clear(), t.behaviorUsability.clear(), t.constrainToWorkArea(), t.prevX = t.x, t.prevY = t.y, t.renderNow();
    }), window.addEventListener("scroll", () => {
      for (const t of f.liveEngines) {
        if (f.externalScroll || f.extensionMode) continue;
        const i = window.scrollY - t.lastScrollY;
        t.lastScrollY = window.scrollY, t.handleExternalScroll(i);
      }
    });
  }
  static removeObserver(e) {
    f.observers.delete(e);
  }
  static getInstances() {
    return Array.from(f.liveEngines);
  }
  /** The active animation configuration. */
  static getAnimationConfig() {
    return f.animationConfig;
  }
  /** The shared affordance registry (two mascots use it to find each other). */
  static getBroadcasts() {
    return f.broadcasts;
  }
  /**
   * Point the engine at its assets. Every URL is resolved by the caller, because
   * an embedded or published build cannot assume it is served from the page root.
   *
   * Call this before the first mascot is created: the animation configuration is
   * fetched once and then cached for the page, so a later change is only picked up
   * by `reloadAnimationConfig()`.
   */
  static configure(e) {
    e.packBaseUrl && (f.packBaseUrl = e.packBaseUrl.replace(/\/+$/, "")), e.animationConfigUrl && !f.animationConfigUrl && (f.animationConfigUrl = e.animationConfigUrl), e.preset !== void 0 && f.animationConfig.setPreset(e.preset), e.ignoreBuiltin !== void 0 && (f.builtinPreference = e.ignoreBuiltin, e.ignoreBuiltin && f.animationConfig.setPreset("classic"), f.applyBuiltinPreference());
  }
  /**
   * Change how the simulation is tuned. Each field is validated as a finite number
   * and anything else is ignored, so a partially-written settings object is safe.
   *
   * It applies to every mascot, including the ones already on the page: the values
   * are read per tick rather than captured at construction, which is what makes a
   * live settings panel possible. The exceptions are positions already computed
   * from the old values (a mascot mid-fall keeps its velocity), so a change is
   * smooth rather than instantaneous.
   */
  static setRuntimeOptions(e) {
    return T = en(e), Object.freeze({ ...T });
  }
  /** The tuning currently in effect. */
  static getRuntimeOptions() {
    return Object.freeze({ ...T });
  }
  /** The asset base URL in effect, for diagnostics and for hosts that build their
   *  own sprite URLs (`spriteUrl()` returns the same shape). */
  static getPackBaseUrl() {
    return f.packBaseUrl;
  }
  /** Switch the active base animation preset (e.g. "classic", "lively", or custom). */
  static setPreset(e) {
    f.animationConfig.setPreset(e);
  }
  /** Get the currently active base animation preset name. */
  static getPreset() {
    return f.animationConfig.getPreset();
  }
  /**
   * Install a configuration from an object in the same shape as the JSON file.
   * This is the entry point a settings UI would use; it wins over the file until
   * `loadAnimationConfig()` is called again with `force`.
   */
  static setAnimationConfig(e, t = "(programmatic)") {
    const i = e == null ? void 0 : e.ignoreBuiltin;
    return typeof i == "boolean" && (f.builtinPreference = i), f.animationConfig = new ge(e, t), f.animationConfigSetExplicitly = !0, f.applyBuiltinPreference(), f.watchReducedMotion(), f.animationConfig;
  }
  /**
   * Re-apply the page-level `ignoreBuiltin` preference to the configuration in
   * effect.
   *
   * `toJSON()` hands back the host's own layer only, so re-seeding it never bakes
   * the built-in preset into anything; a page that never passes the flag keeps
   * whatever the file said.
   */
  static applyBuiltinPreference() {
    const e = f.builtinPreference;
    if (e === null) return;
    const t = f.animationConfig, i = t.toJSON();
    i.ignoreBuiltin === !0 !== e && (f.animationConfig = new ge(
      { ...i, ignoreBuiltin: e },
      t.source
    ));
  }
  /**
   * Read the configuration file once and keep it. A missing or invalid file leaves
   * the built-in preset in place (or the packs' own settings, when the page asked
   * for `ignoreBuiltin`), so this never breaks the app.
   *
   * Probing the classic path is the price of the "just drop a file at
   * `/animation.config.json`" workflow: a host that has no file sees one expected
   * 404 per page load, and nothing else.
   */
  static loadAnimationConfig(e) {
    e && (f.animationConfigUrl = e);
    const t = f.animationConfigUrl ?? f.ANIMATION_CONFIG_URL;
    return f.animationConfigLoad || (f.animationConfigLoad = (async () => {
      try {
        const i = new AbortController(), n = window.setTimeout(() => i.abort(), 3e3);
        try {
          const o = await fetch(t, {
            cache: "no-store",
            signal: i.signal
          }), s = o.headers.get("content-type") ?? "";
          if (!o.ok || !s.includes("json")) return;
          const a = await o.json();
          f.animationConfigSetExplicitly || (f.animationConfig = new ge(a, t)), f.applyBuiltinPreference();
        } finally {
          window.clearTimeout(n);
        }
      } catch {
      } finally {
        f.watchReducedMotion();
      }
    })()), f.animationConfigLoad;
  }
  /**
   * Follow the OS reduced-motion preference, now and on later changes.
   *
   * The disposer is kept instead of the listener because a bare listener can never
   * be unregistered: `matchMedia` needs the very `MediaQueryList` it came from, so
   * the old code left a page-lifetime listener behind with no way to remove it.
   */
  static watchReducedMotion() {
    if (f.animationConfig.refreshReducedMotion(), !f.reducedMotionWatcher && !(typeof window > "u" || typeof window.matchMedia != "function"))
      try {
        const e = window.matchMedia("(prefers-reduced-motion: reduce)"), t = () => f.animationConfig.setReducedMotion(e.matches);
        e.addEventListener("change", t), f.reducedMotionWatcher = () => {
          e.removeEventListener("change", t), f.reducedMotionWatcher = null;
        };
      } catch {
      }
  }
  /** Re-read the file, discarding both the cache and any programmatic override. */
  static async reloadAnimationConfig(e) {
    return f.animationConfigLoad = null, f.animationConfigSetExplicitly = !1, e && (f.animationConfigUrl = e), await f.loadAnimationConfig(), f.animationConfig;
  }
  async init(e) {
    var s, a;
    (e == null ? void 0 : e.scrollSquash) !== void 0 && (this.scrollSquashEnabled = e.scrollSquash), e != null && e.startPaused && this.setPauseReason("relay-transfer", !0), await f.loadAnimationConfig(), (s = e == null ? void 0 : e.signal) == null || s.throwIfAborted();
    const t = $e.get(this.mascotName);
    if (t ? this.config = it.parseRawConfig(
      t.actionsXml,
      t.behaviorsXml,
      this.mascotName
    ) : this.config = await it.loadConfig(
      this.mascotName,
      this.packBaseUrl,
      e == null ? void 0 : e.signal
    ), this.destroyed) return;
    let i = !1;
    e != null && e.initialSnapshot && (i = this.restoreRelaySnapshot(e.initialSnapshot)), i || this.applySpawnPosition(), this.resetScrollTracking(), this.prevX = this.x, this.prevY = this.y, f.liveEngines.add(this), this.container.appendChild(this.elRoot), this.watchVisibility();
    const n = i ? e.initialSnapshot.behaviorName : "Fall";
    if (i || (this.setBehavior(n, "spawn"), this.advanceActionTree()), this.constrainToWorkArea(), this.preloadSprites(), await this.warmFirstPose(), this.destroyed) return;
    this.render(!1), this.elRoot.style.visibility = e != null && e.startPaused ? "hidden" : "visible", this.emit({
      kind: "spawn",
      detail: `viewport=${window.innerWidth}x${window.innerHeight}`
    }), i && this.emit({
      kind: "milestone",
      name: "relay-resume",
      detail: `behavior=${(a = this.currentBehavior) == null ? void 0 : a.name}`,
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    }), this.lastTime = performance.now(), document.hidden && this.setPauseReason("hidden", !0), ((e == null ? void 0 : e.enablePageCoordinator) ?? !f.extensionMode) && (this.unregisterPage = ui(
      (c) => this.setPauseReason("background-page", !c)
    )), this.pauseReasons.size === 0 && (this.loopId = requestAnimationFrame((c) => this.loop(c)));
  }
  /** URL of a pack sprite. Supports in-memory PackRegistry, path normalization, and HTTP fallback. */
  spriteUrl(e) {
    const t = $e.get(this.mascotName);
    if (t) {
      const o = Xe(e), s = t.sprites.get(o) || t.sprites.get(e);
      if (s) return s;
      console.warn(
        `[web-mascot] Sprite "${e}" (key: "${o}") not found in registered pack "${this.mascotName}"`
      );
    }
    const i = e.replace(/^[/\\]+/, ""), n = i.toLowerCase().startsWith("img/") ? i.slice(4).replace(/^[/\\]+/, "") : i;
    return `${this.packBaseUrl}/img/${n}`;
  }
  /**
   * Fetch every sprite the pack can show, once per pack. The browser then serves the
   * pose changes from its decoded cache, so swapping poses no longer flashes an empty
   * image. Cheap: these packs are ~100 images of 128 px.
   */
  preloadSprites() {
    var i;
    const e = (i = this.config) == null ? void 0 : i.actions;
    if (!e) return;
    const t = /* @__PURE__ */ new Set();
    for (const n of Object.values(e))
      $t(n, t, (o) => this.spriteUrl(o));
    for (const n of t) {
      if (f.preloaded.has(n)) continue;
      f.preloaded.add(n);
      const o = new Image();
      o.decoding = "async", o.src = n;
    }
  }
  /** Await the actual first bitmap; never remove a placeholder for an undecoded image. */
  async warmFirstPose() {
    const e = this.currentPose(), t = e != null && e.image ? this.spriteUrl(e.image) : this.elImg.getAttribute("src");
    if (!t) return;
    this.elImg.src = t;
    let i = 0;
    try {
      if (await Promise.race([
        this.elImg.decode(),
        new Promise((n, o) => {
          i = window.setTimeout(
            () => o(new Error("First sprite decode timed out")),
            1500
          );
        })
      ]), !this.elImg.naturalWidth)
        throw new Error("First sprite has no bitmap");
      this.applySpriteIntrinsicSize();
    } catch (n) {
      if ((e == null ? void 0 : e.image) !== "/shime1.png" && (e == null ? void 0 : e.image) !== "shime1.png")
        try {
          if (this.elImg.src = this.spriteUrl("/shime1.png"), await this.elImg.decode(), this.elImg.naturalWidth) {
            this.applySpriteIntrinsicSize();
            return;
          }
        } catch {
        }
      throw n;
    } finally {
      window.clearTimeout(i);
    }
  }
  /**
   * Size the sprite box from the decoded bitmap. Packs may declare anything, and
   * a zero-area box would defeat both painting and hit testing, so the previous
   * value is kept until a real one is known (see the constructor for why the size
   * must be definite at all).
   */
  applySpriteIntrinsicSize() {
    const e = this.elImg, t = e.naturalWidth || X, i = e.naturalHeight || X;
    e.style.width === `${t}px` && e.style.height === `${i}px` || (e.style.width = `${t}px`, e.style.height = `${i}px`, this.elRoot.style.width = `${t}px`, this.elRoot.style.height = `${i}px`);
  }
  /** Pause while the mascot's container is scrolled out of view, so an embedded
   *  mascot costs nothing when the visitor is reading another part of the page. */
  watchVisibility() {
    if (typeof IntersectionObserver != "function") return;
    const e = this.container ?? this.elRoot;
    try {
      this.intersectionObserver = new IntersectionObserver(
        (t) => {
          const i = t[t.length - 1];
          if (!i) return;
          const n = i.boundingClientRect;
          if (n.width <= 0 || n.height <= 0) {
            this.setVisible(!0);
            return;
          }
          this.setVisible(i.isIntersecting);
        },
        { root: null, threshold: 0 }
      ), this.intersectionObserver.observe(e);
    } catch {
      this.intersectionObserver = null;
    }
  }
  resetScrollTracking() {
    this.lastScrollY = window.scrollY, this.pendingScrollShift = 0, this.scrollDetachPending = null, this.lastDocumentScrollAt = null, this.scrollFloorBlocked = !1, this.scrollFallRoot = null, this.scrollFallHeight = 0;
  }
  setVisible(e) {
    this.visible !== e && (this.visible = e, this.setPauseReason("viewport", !e), this.later(() => {
      this.destroyed || !this.visible && this.isOnScreen() && this.setVisible(!0);
    }, 2e3));
  }
  /** `setTimeout` that `destroy()` will cancel. */
  later(e, t) {
    const i = window.setTimeout(() => {
      this.pendingTimers.delete(i), e();
    }, t);
    this.pendingTimers.add(i);
  }
  setPauseReason(e, t) {
    const i = this.pauseReasons.size > 0;
    t ? this.pauseReasons.add(e) : this.pauseReasons.delete(e);
    const n = this.pauseReasons.size > 0;
    i !== n && (n ? (cancelAnimationFrame(this.loopId), this.resetScrollTracking(), this.emit({
      kind: "milestone",
      name: "paused",
      detail: e,
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    })) : (this.resetScrollTracking(), this.emit({
      kind: "milestone",
      name: "resumed",
      detail: e,
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    }), this.resumeLoop()));
  }
  isOnScreen() {
    const e = (this.container ?? this.elRoot).getBoundingClientRect();
    return e.bottom > 0 && e.right > 0 && e.top < window.innerHeight && e.left < window.innerWidth;
  }
  resumeLoop() {
    this.destroyed || (cancelAnimationFrame(this.loopId), this.lastTime = performance.now(), this.accumulator = 0, this.loopId = requestAnimationFrame((e) => this.loop(e)));
  }
  destroy() {
    var e, t;
    if (!this.destroyed) {
      this.destroyed = !0, cancelAnimationFrame(this.loopId), (e = this.unregisterPage) == null || e.call(this), this.unregisterPage = null, (t = this.intersectionObserver) == null || t.disconnect(), this.intersectionObserver = null, this.cancelPress(), this.eventsAbortController.abort();
      for (const i of this.pendingTimers) window.clearTimeout(i);
      this.pendingTimers.clear(), this.releaseStack(), this.actionStack = [], this.interaction.finalize(), this.emit({ kind: "despawn", detail: "destroy()" }), f.liveEngines.delete(this), this.elRoot.parentNode && this.elRoot.parentNode.removeChild(this.elRoot);
    }
  }
  /** Current observable state, for timers and for poking at the mascot in the
   *  browser console: `__mascotEngines[0].snapshot()`. */
  /** Where the mascot is drawn, in viewport pixels. The engine's own coordinates are
   *  virtual units (1 unit = 1 sprite pixel at `scale`), so anything outside the
   *  engine — logs, host code — should read this instead of `x`/`y`. */
  position() {
    const e = this.spriteScale;
    return { x: this.x * e, y: this.y * e };
  }
  snapshot() {
    var i;
    const e = this.currentLeaf(), t = this.spriteScale;
    return {
      pet: this.label,
      mascot: this.mascotName,
      x: this.x * t,
      y: this.y * t,
      behavior: ((i = this.currentBehavior) == null ? void 0 : i.name) ?? "",
      leaf: this.leafLabel(),
      path: this.stackPath(),
      nodeType: (e == null ? void 0 : e.type) ?? "",
      border: (e == null ? void 0 : e.borderType) ?? "",
      image: this.currentImage(),
      lookRight: this.lookRight,
      stackDepth: this.actionStack.length,
      dragging: this.isDragging,
      tick: this.tickCount
    };
  }
  /** Name of the behavior currently running, or null if none. */
  get currentBehaviorName() {
    var e;
    return ((e = this.currentBehavior) == null ? void 0 : e.name) ?? null;
  }
  /**
   * Get list of all distinct behaviors with surface requirements and immediate availability.
   */
  getBehaviors() {
    if (!this.config) return [];
    const e = [], t = /* @__PURE__ */ new Set(), i = this.currentBorderAt(void 0);
    for (const n of this.config.behaviors) {
      if (t.has(n.name)) continue;
      t.add(n.name);
      const o = this.firstBorderOf(n.name), s = o === "Floor" || o === "Wall" || o === "Ceiling" ? o : null, a = s === null || o === re || s === i;
      e.push({
        name: n.name,
        requiredSurface: s,
        available: a,
        hidden: n.hidden
      });
    }
    return e;
  }
  /**
   * Check whether a behavior or action can immediately execute on the mascot's current surface.
   */
  canExecuteBehavior(e) {
    if (!this.config) return !1;
    const t = this.config.behaviors.some((s) => s.name === e), i = !!this.config.actions[e];
    if (!t && !i) return !1;
    const n = this.firstBorderOf(e);
    if (n === null || n === re) return !0;
    const o = this.currentBorderAt(void 0);
    return n === o;
  }
  /**
   * Force the mascot to switch to a target behavior, bypassing surface constraints and
   * snapping to the required surface by default.
   */
  forceBehavior(e, t) {
    return this.setBehavior(e, { ...t, force: !0 });
  }
  /** Convert a virtual length or coordinate to viewport pixels (the log's unit). */
  toPage(e) {
    return e * this.spriteScale;
  }
  emit(e) {
    if (!f.observers.size) return;
    const t = this.spriteScale;
    let i = e;
    if (t !== 1) {
      const n = e, o = [
        "x",
        "y",
        "px",
        "py",
        "dx",
        "dy",
        "step",
        "targetX",
        "targetY"
      ];
      let s = null;
      for (const a of o)
        typeof n[a] == "number" && (s ?? (s = { ...n }), s[a] = n[a] * t);
      s && (i = s);
    }
    for (const n of f.observers)
      try {
        n(this, i);
      } catch {
      }
  }
  currentImage() {
    return (this.elImg.getAttribute("src") ?? "").split("/").pop() ?? "";
  }
  leafLabel() {
    const e = this.currentLeaf();
    return e ? `${e.name ?? e.className ?? "?"}|${e.type}` : "-";
  }
  /**
   * A client point in sprite (bitmap) coordinates, matching how the image is drawn
   * and how libshijima computes it:
   *
   *   looking left   left edge = anchor.x - ImageAnchor.x
   *   looking right  left edge = anchor.x - (width - ImageAnchor.x)   (mirrored)
   *
   * Qt hardcodes 128 here ("FIXME: assumes width of 128"); the real bitmap width is
   * used instead, which is the same number for these packs and stays correct for
   * others.
   */
  /**
   * A client point in sprite (bitmap) coordinates — boundary two, screen → virtual.
   *
   * Because the engine works in virtual units and one virtual unit is one sprite
   * pixel, the bitmap's own geometry (ImageAnchor, the 128 px width) *is* the virtual
   * geometry, so the local point is simply the virtual cursor minus the sprite's
   * virtual top-left. The hotspot origins then compare directly, at any drawn size.
   */
  spritePoint(e, t) {
    const i = this.currentPose();
    if (!i) return null;
    const n = this.toVirtual(e, t), o = this.elImg.naturalWidth || X, s = this.hostShift(), a = (this.lookRight ? this.x - (o - i.imageAnchor.x) : this.x - i.imageAnchor.x) + s.x, c = this.y - i.imageAnchor.y + s.y;
    return { x: n.x - a, y: n.y - c };
  }
  /**
   * How far the host's CSS moves the anchor away from the coordinates this engine
   * computes, in virtual units.
   *
   * The engine's own model is `x`/`y`, but nothing stops the host from moving the
   * anchor with CSS — firefly lifts it above its music player
   * (`body.has-global-player #mascot-pet-anchor { transform: translateY(-4.5rem) }`).
   * Pointer mapping has to follow the pixels the visitor sees, or a press lands on
   * whatever the engine *would* have drawn at that spot: measured 56–72 px off in
   * firefly, which made the drawn head unpressable and put the hotspots on the body.
   *
   * The shift is measured from the DOM at most once per logic tick (and forced before
   * a press), because the anchor's border box already carries both this engine's
   * transform and the host's.
   */
  hostShift(e = !1) {
    if (!e && this.hostShiftCache.tick === this.tickCount)
      return this.hostShiftCache;
    const t = this.spriteScale, i = this.elRoot.getBoundingClientRect();
    return this.hostShiftCache = {
      x: i.left / t - this.x,
      y: i.top / t - this.y,
      tick: this.tickCount
    }, this.hostShiftCache;
  }
  /** The hotspot under a client point, if that behaviour is allowed to run. */
  hotspotUnderCursor(e, t) {
    if (!this.config || !this.actionStack.length) return null;
    const i = this.actionStack[this.actionStack.length - 1], n = i ? this.activeAnimation(i) : void 0;
    if (!(n != null && n.hotspots)) return null;
    const o = this.spritePoint(e, t);
    if (!o) return null;
    const s = ai(n.hotspots, o);
    return !s || f.animationConfig.denies(this.mascotName, s.behavior) ? null : s;
  }
  stackPath() {
    return this.actionStack.map(
      (e) => e.node.name ?? e.node.className ?? e.node.type
    ).join(" > ");
  }
  bindEvents() {
    const e = this.eventsAbortController.signal;
    this.elRoot.addEventListener(
      "pointerdown",
      (t) => {
        var n, o;
        if (t.button !== 0 || this.pressActive && this.activePointerId !== null && this.activePointerId !== t.pointerId || (this.hostShift(!0), !this.isOpaqueAt(t.clientX, t.clientY))) return;
        this.activePointerId = t.pointerId;
        try {
          (o = (n = this.elRoot).setPointerCapture) == null || o.call(n, t.pointerId);
        } catch {
        }
        this.pressActive = !0, this.pressStartAt = performance.now(), this.pressClientX = t.clientX, this.pressClientY = t.clientY, this.pressMaxMovement = 0, this.hotspotHoldTriggered = !1, this.cursorX = t.clientX, this.cursorY = t.clientY, this.cursorButtons = t.buttons;
        const i = this.hotspotUnderCursor(t.clientX, t.clientY);
        if (i) {
          this.hotspotHold = i, this.elRoot.style.cursor = "pointer";
          return;
        }
        this.hotspotHold = null, this.beginDrag(t.clientX, t.clientY);
      },
      { signal: e }
    );
  }
  /**
   * Linear size multiplier of the drawn mascot. The engine keeps every coordinate
   * in *virtual* units where one unit is one sprite pixel, exactly like libshijima's
   * `environment::set_scale`, and converts only at the two boundaries: rendering
   * (virtual → screen) and pointer input (screen → virtual). That is what lets the
   * packs' own pixel constants — `workArea.top+64`, `width-128`, pose velocities,
   * `Offset Y=1`, hotspot origins — stay correct at any drawn size, and it keeps the
   * relative motion feel identical (a bigger mascot covers more pixels per tick).
   */
  get spriteScale() {
    return f.animationConfig.mascotScale(this.mascotName);
  }
  /** Viewport extent in virtual units. */
  get virtualWidth() {
    return window.innerWidth / this.spriteScale;
  }
  get virtualHeight() {
    return window.innerHeight / this.spriteScale;
  }
  /** A client (screen) point in virtual units. */
  toVirtual(e, t) {
    const i = this.spriteScale;
    return { x: e / i, y: t / i };
  }
  /**
   * The cursor the *simulation* reads, in virtual units: the pointer, plus this
   * drag's grab offset while the mascot is held. Qt reads the same value here and in
   * the pack's `mascot.environment.cursor` (`state::get_raw_cursor()` →
   * `roll_dcursor()` → `get_cursor()`), so the held pose's `FootX` comparison and the
   * anchor stay in one reference frame.
   */
  simulationCursorVirtual() {
    const e = this.toVirtual(this.cursorX, this.cursorY);
    return this.dragGrab ? { x: e.x + this.dragGrab.x, y: e.y + this.dragGrab.y } : e;
  }
  /** `environment.cursor` for the pack expressions: position and per-tick delta,
   *  both in virtual units. */
  cursorInVirtualUnits() {
    const e = this.simulationCursorVirtual();
    return {
      x: e.x,
      y: e.y,
      dx: this.cursorTickDX,
      dy: this.cursorTickDY
    };
  }
  /** Release a held mascot: the grab offset goes away, so the pointer is the cursor
   *  again. The behaviour change (Thrown, resist-escape) is the caller's job. */
  endDrag() {
    this.isDragging = !1, this.dragGrab = null, this.elRoot.style.cursor = "grab";
  }
  /** Release a held mascot: snap to wall if held against a boundary, otherwise throw. */
  releaseDrag(e = "drag-release") {
    this.endDrag();
    const t = this.area(), i = this.borderIsOn("left", { x: this.x, y: this.y }, t), n = this.borderIsOn("right", { x: this.x, y: this.y }, t);
    if (this.y < t.bottom && (i || n)) {
      const o = this.simulationCursorVirtual(), s = this.actionStack[this.actionStack.length - 1], a = this.varNumber(s, "OffsetX") ?? T.dragOffsetX, c = o.x + a;
      if (n && (c >= t.right || this.cursorTickDX >= 0) || i && (c <= t.left || this.cursorTickDX <= 0)) {
        const u = i ? "left-wall" : "right-wall";
        this.x = u === "left-wall" ? t.left : t.right, this.vx = this.vy = 0, this.lookRight = u === "right-wall", this.lastSurface = u, this.setBehavior("HoldOntoWall", "wall-supported"), this.actionExpansionsThisTick = 0, this.advanceActionTree();
        return;
      }
    }
    this.setBehavior("Thrown", e), this.actionExpansionsThisTick = 0, this.advanceActionTree();
  }
  /** Pick the mascot up: Qt does this from `beginLeftPress()` when the press is not on
   *  a hotspot, and from `mouseMoveEvent()` when a hotspot candidate leaves the hold
   *  tolerance. */
  beginDrag(e, t) {
    this.isDragging = !0, this.resetScrollTracking(), this.elRoot.style.cursor = "grabbing";
    const i = this.toVirtual(e, t);
    this.dragPressAnchorX = this.x, this.dragPressAnchorY = this.y, this.dragPressCursorX = i.x, this.dragPressCursorY = i.y, this.dragGrab = null, this.cursorX = e, this.cursorY = t, this.footX = this.x, this.footDX = 0, this.dragStillTicks = 0, this.vx = this.vy = 0, this.interaction.finalize(), this.setBehavior("Dragged", "drag-start");
  }
  /**
   * `dragged::subtick()`: pin the anchor to `cursor + OffsetX/OffsetY`.
   *
   * Qt runs this once per *subtick* — every 10 ms, i.e. four times per logic frame —
   * and assigns the anchor directly, without interpolation. The viewport bounds
   * also apply to dragging. The
   * web engine ticks every 40 ms, so this is called from the tick *and* from every
   * pointer event, and `render()` skips interpolation while a drag is active.
   */
  applyDragAnchor() {
    const e = this.actionStack[this.actionStack.length - 1];
    if (this.isResistAction(e == null ? void 0 : e.node)) return;
    const t = this.varNumber(e, "OffsetX") ?? T.dragOffsetX, i = this.varNumber(e, "OffsetY") ?? T.dragOffsetY;
    this.dragGrab || (this.dragGrab = {
      x: this.dragPressAnchorX - this.dragPressCursorX - t,
      y: this.dragPressAnchorY - this.dragPressCursorY - i
    }, this.footX = this.dragPressAnchorX);
    const n = this.simulationCursorVirtual();
    this.x = n.x + t, this.y = n.y + i, this.constrainToWorkArea();
  }
  /** Qt `ShijimaWidget::mouseMoveEvent()`: remember how far the pointer has travelled
   *  since the press, and let a hotspot candidate become a pickup once it leaves the
   *  hold tolerance. */
  updatePressMovement() {
    if (!this.pressActive) return;
    const e = Math.abs(this.cursorX - this.pressClientX) + Math.abs(this.cursorY - this.pressClientY);
    this.pressMaxMovement = Math.max(this.pressMaxMovement, e), !(this.isDragging || !this.hotspotHold) && (e <= ut || (this.hotspotHold = null, this.beginDrag(this.cursorX, this.cursorY)));
  }
  /** Qt `ShijimaWidget::maintainHotspotHold()`: a press that has been held inside the
   *  tolerances long enough runs the hotspot's behaviour, and keeps it running. Qt
   *  pins the behaviour's next selection to itself (`prefer_next_behavior`) so the
   *  patpat repeats; re-issuing it whenever the mascot has moved on is the equivalent
   *  here, without touching the behaviour-selection machinery. */
  maintainHotspotHold() {
    var t;
    if (!this.pressActive || !this.hotspotHold || this.isDragging || performance.now() - this.pressStartAt < on || this.pressMaxMovement > ut) return;
    const e = this.hotspotHold.behavior;
    this.hotspotHoldTriggered = !0, ((t = this.currentBehavior) == null ? void 0 : t.name) !== e && (this.emitHotspot("hold", this.hotspotHold), this.setBehavior(e, "hotspot-hold"));
  }
  /** Qt `ShijimaWidget::mouseReleaseEvent()`: a short, still release counts as a click
   *  and triggers the hotspot under the *release* point (`manager::trigger_hotspot`);
   *  a release after a pickup throws the mascot (`dragged::handle_dragging`). */
  finishPress(e, t) {
    var c, u;
    if (!this.pressActive) return;
    if (this.activePointerId !== null) {
      try {
        (u = (c = this.elRoot).hasPointerCapture) != null && u.call(c, this.activePointerId) && this.elRoot.releasePointerCapture(this.activePointerId);
      } catch {
      }
      this.activePointerId = null;
    }
    const i = performance.now() - this.pressStartAt, n = this.hotspotHoldTriggered, o = this.hotspotHold !== null, s = this.pressMaxMovement;
    if (this.pressActive = !1, this.hotspotHold = null, this.hotspotHoldTriggered = !1, this.isDragging) {
      this.releaseDrag("drag-release");
      return;
    }
    if (n || !o || i > an || s > sn)
      return;
    const a = this.hotspotUnderCursor(e, t);
    a && (this.emitHotspot("click", a), this.setBehavior(a.behavior, "hotspot"));
  }
  /** Drop a press without deciding a gesture (the tab went hidden mid-press). */
  cancelPress() {
    var e, t;
    if (this.activePointerId !== null) {
      try {
        (t = (e = this.elRoot).hasPointerCapture) != null && t.call(e, this.activePointerId) && this.elRoot.releasePointerCapture(this.activePointerId);
      } catch {
      }
      this.activePointerId = null;
    }
    this.pressActive = !1, this.hotspotHold = null, this.hotspotHoldTriggered = !1;
  }
  emitHotspot(e, t) {
    const i = this.spritePoint(this.cursorX, this.cursorY);
    this.emit({
      kind: "milestone",
      name: "hotspot",
      detail: `${e} behavior=${t.behavior} shape=${t.shape} local=${i ? `${i.x.toFixed(0)},${i.y.toFixed(0)}` : "?"}(sprite px)`,
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    });
  }
  /** `ShijimaWidget::pointInside()`: a press only belongs to the mascot when it lands
   *  on an opaque pixel of the frame it is showing. The bitmap is cached until the
   *  image changes; a canvas that cannot be read (sprites served from another origin)
   *  degrades to the whole box. */
  isOpaqueAt(e, t) {
    const i = this.spritePoint(e, t);
    if (!i) return !1;
    const n = this.elImg, o = n.naturalWidth || X, s = n.naturalHeight || X;
    if (i.x < 0 || i.y < 0 || i.x > o || i.y > s)
      return !1;
    const a = this.frameAlpha();
    if (!a) return !0;
    const c = Math.min(
      o - 1,
      Math.max(0, Math.round(this.lookRight ? o - i.x : i.x))
    ), u = Math.min(s - 1, Math.max(0, Math.round(i.y)));
    return a.data[(u * a.width + c) * 4 + 3] !== 0;
  }
  /** The pixels of the frame the mascot is currently showing, cached per image URL. */
  frameAlpha() {
    const e = this.elImg.getAttribute("src") ?? "";
    if (this.alphaSrc === e) return this.alphaData;
    this.alphaSrc = e, this.alphaData = null;
    const t = this.elImg;
    if (!e || !t.complete || t.naturalWidth === 0) return null;
    const i = this.alphaCanvas ?? (this.alphaCanvas = document.createElement("canvas"));
    i.width = t.naturalWidth, i.height = t.naturalHeight;
    const n = i.getContext("2d", { willReadFrequently: !0 });
    if (!n) return null;
    try {
      n.clearRect(0, 0, i.width, i.height), n.drawImage(t, 0, 0), this.alphaData = n.getImageData(0, 0, i.width, i.height);
    } catch {
      this.alphaData = null;
    }
    return this.alphaData;
  }
  /** Resolve a configuration Metric against one viewport axis. A bare number is a
   *  page pixel value, so it is divided by the sprite scale to reach virtual units;
   *  percentages and `left`/`right`/`top`/`bottom`/`center` follow the viewport. */
  metric(e, t, i) {
    if (e === void 0) return i;
    const n = t === "x" ? this.virtualWidth : this.virtualHeight, o = this.spriteScale;
    if (typeof e == "number")
      return Number.isFinite(e) ? e / o : i;
    const s = String(e).trim().toLowerCase();
    if (s.endsWith("%")) {
      const c = Number(s.slice(0, -1));
      return Number.isFinite(c) ? n * c / 100 : i;
    }
    if (s === "left" || s === "top") return 0;
    if (s === "right" || s === "bottom") return n;
    if (s === "center") return n / 2;
    const a = Number(s);
    return Number.isFinite(a) ? a / o : i;
  }
  /** The mascot's activity rectangle in viewport coordinates. */
  area() {
    const e = f.animationConfig.zone(this.mascotName), t = this.metric(e.left, "x", 0), i = this.metric(e.right, "x", this.virtualWidth), n = this.metric(e.top, "y", 0), o = this.metric(e.bottom, "y", this.virtualHeight);
    return {
      left: t,
      right: Math.max(t + 1, i),
      top: n,
      bottom: Math.max(n + 1, o)
    };
  }
  /** Start position from the configuration: top or floor, any x, and several
   *  mascots are spread apart instead of stacking on one spot. */
  applySpawnPosition(e) {
    const t = f.animationConfig.spawn(this.mascotName), i = this.area(), n = this.metric(t.x, "x", (i.left + i.right) / 2), o = e ?? f.liveEngines.size, s = (t.staggerPx ?? 0) / this.spriteScale, a = o === 0 || s === 0 ? 0 : (o % 2 === 1 ? 1 : -1) * Math.ceil(o / 2) * s;
    this.x = Math.min(i.right, Math.max(i.left, n + a)), this.y = t.vertical === "floor" ? i.bottom : i.top + (t.topOffset ?? 100) / this.spriteScale;
  }
  /** Is `point` on one of the work-area borders? */
  borderIsOn(e, t, i = this.area()) {
    if (e === "top" || e === "bottom") {
      const s = e === "top" ? i.top : i.bottom;
      return Math.abs(t.y - s) < 1 && t.x >= i.left && t.x <= i.right;
    }
    const o = e === "left" ? i.left : i.right;
    return Math.abs(t.x - o) < 1 && t.y >= i.top && t.y <= i.bottom;
  }
  environment() {
    const e = this.area(), t = (n) => ({
      isOn: (o) => this.borderIsOn(n, o, e)
    }), i = {
      ...e,
      width: e.right - e.left,
      height: e.bottom - e.top,
      topBorder: t("top"),
      rightBorder: t("right"),
      bottomBorder: t("bottom"),
      leftBorder: t("left"),
      isOn: (n) => ["top", "right", "bottom", "left"].some(
        (o) => this.borderIsOn(
          o,
          n,
          e
        )
      )
    };
    return {
      floor: {
        isOn: (n) => this.borderIsOn("bottom", n, e)
      },
      ceiling: {
        isOn: (n) => this.borderIsOn("top", n, e)
      },
      wall: {
        isOn: (n) => this.borderIsOn("left", n, e) || this.borderIsOn("right", n, e)
      },
      workArea: i,
      screen: { ...i },
      activeIE: {
        visible: !1,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: 0,
        height: 0,
        topBorder: { isOn: () => !1 },
        bottomBorder: { isOn: () => !1 },
        leftBorder: { isOn: () => !1 },
        rightBorder: { isOn: () => !1 },
        isOn: () => !1
      },
      // The cursor is a sprite-unit quantity for the packs: `Pinched` picks its held
      // pose from `#{FootX < mascot.environment.cursor.x-50}`, `ChaseMouse` targets
      // `cursor.x`, `SitAndFaceMouse` compares against `anchor.x` — all virtual. It
      // has to be converted here, otherwise every such comparison mixes units and
      // the mascot is stuck on one variant (which is what a held mascot did at any
      // scale other than 1).
      cursor: this.cursorInVirtualUnits()
    };
  }
  mascotScope(e) {
    const t = {
      anchor: { x: this.x, y: this.y },
      lookRight: this.lookRight,
      environment: this.environment(),
      totalCount: Math.max(1, f.liveEngines.size),
      ...e
    };
    return { finalMascot: t, mascot: t, Math, ...e };
  }
  run(e, t) {
    return Ai(this.cleanExpression(e), t);
  }
  /**
   * libshijima splits the attributes of an <ActionReference> in two
   * (scripting::variables::add_attr):
   *   ${expr} is "dynamic (once)"       — evaluated when the action starts;
   *   #{expr} is "dynamic (every frame)" — re-evaluated on each tick.
   * Freezing ${...} is what keeps TargetX/TargetY stable for the whole action: a
   * target that is re-rolled every tick makes the mascot jitter around it
   * ("stuck halfway up the wall") instead of travelling to it.
   */
  resolveVars(e, t = {}, i = !1) {
    const n = { ...t }, o = {};
    for (const [u, h] of Object.entries(e))
      u === "Condition" || Object.prototype.hasOwnProperty.call(n, u) || h.startsWith("#{") && !i || (/^[#$]\{/.test(h) ? o[u] = h : h === "true" || h === "false" ? n[u] = h === "true" : n[u] = h.trim() !== "" && Number.isFinite(Number(h)) ? Number(h) : h);
    const s = this.mascotScope({ ...e, ...n }), a = /* @__PURE__ */ new Set(), c = (u) => {
      if (Object.prototype.hasOwnProperty.call(n, u)) return n[u];
      if (a.has(u)) throw new Error(`Cyclic action attribute: ${u}`);
      a.add(u);
      try {
        n[u] = this.run(o[u], s);
      } catch {
        n[u] = o[u];
      } finally {
        a.delete(u);
      }
      return n[u];
    };
    for (const u of Object.keys(o))
      Object.defineProperty(s, u, { configurable: !0, get: () => c(u) }), Object.defineProperty(s.mascot, u, { configurable: !0, get: () => c(u) });
    for (const u of Object.keys(o)) c(u);
    return n;
  }
  /** Frozen attributes are evaluated once per instance; live attributes once per tick. */
  frameVars(e) {
    if (!e) return {};
    const t = e.vars, i = e.resolved = this.resolveVars(t, e.resolved);
    return this.isDragging && (i.FootX = this.footX, i.footX = this.footX, i.FootDX = this.footDX, i.footDX = this.footDX), Object.entries(t).some(([n, o]) => n !== "Condition" && o.startsWith("#{")) ? (e.liveTick !== this.tickCount && (e.live = this.resolveVars(t, i, !0), e.liveTick = this.tickCount), { ...t, ...e.live }) : { ...t, ...i };
  }
  varValue(e, t) {
    return this.frameVars(e)[t];
  }
  varString(e, t) {
    const i = this.varValue(e, t);
    return i == null ? "" : typeof i == "string" ? i : String(i);
  }
  varNumber(e, t) {
    const i = this.varValue(e, t);
    return typeof i == "number" && Number.isFinite(i) ? i : null;
  }
  context(e) {
    var i;
    const t = (i = e == null ? void 0 : e.client) == null ? void 0 : i.target;
    return this.mascotScope({
      ...this.frameVars(e),
      target: t ? { anchor: { x: t.x, y: t.y } } : void 0
    });
  }
  cleanExpression(e) {
    return e.replace(/^\$\{|^#\{|\}$/g, "").trim();
  }
  evaluate(e, t) {
    if (e)
      try {
        return this.run(e, this.context(t));
      } catch (i) {
        const n = `${this.mascotName}:${e}`;
        lt.has(n) || (lt.add(n), Ki.warn("expression evaluation failed", {
          mascot: this.mascotName,
          expression: e,
          error: i instanceof Error ? i.message : String(i)
        }));
        return;
      }
  }
  evaluateCondition(e, t) {
    if (!e) return !0;
    if (!t) return !!this.evaluate(e, t);
    if (!e.startsWith("${") && t.conditionTick !== this.tickCount) {
      for (const i of Object.keys(t.conditions)) i.startsWith("${") || delete t.conditions[i];
      t.conditionTick = this.tickCount;
    }
    return Object.prototype.hasOwnProperty.call(t.conditions, e) || (t.conditions[e] = !!this.evaluate(e, t)), t.conditions[e];
  }
  evaluateNumber(e, t) {
    const i = this.evaluate(e, t);
    return typeof i == "number" && Number.isFinite(i) ? i : null;
  }
  frameConditionsSatisfied(e) {
    return this.evaluateCondition(e.node.condition, e) && this.evaluateCondition(e.vars.Condition, e);
  }
  newFrame(e, t = {}, i = {}, n = -1, o = 0, s) {
    const a = {
      node: e,
      parentIndex: n,
      referenceDepth: o,
      childIndex: 0,
      // libshijima layers the action's own attributes under the <ActionReference>
      // overlay, so a condition may read either of them.
      vars: { ...e.attributes || {}, ...t },
      resolved: i,
      live: {},
      liveTick: -1,
      conditions: { ...s == null ? void 0 : s.conditions },
      conditionTick: s == null ? void 0 : s.conditionTick,
      durationLimit: null,
      finishCycle: !1,
      elapsed: 0,
      poseIndex: 0,
      poseTick: 0,
      stallTicks: 0,
      progressX: NaN,
      progressY: NaN,
      server: null,
      client: null,
      animation: void 0,
      bornTick: this.tickCount
    };
    return e.type !== "ActionReference" && this.frameConditionsSatisfied(a) && this.initBroadcast(a), a;
  }
  childFrame(e, t, i) {
    const n = { ...e.resolved }, o = { ...e.vars };
    delete o.Condition, delete n.Condition;
    for (const s of Object.keys(t.attributes ?? {})) delete n[s];
    return this.newFrame(t, { ...o, ...t.attributes }, n, i);
  }
  /** libshijima `base::init()`: an action that advertises an `Affordance` starts a
   *  broadcast as it is created and clears the attribute, so it advertises once.
   *  A ScanMove action is the scanning side: it looks for somebody else's
   *  advertisement instead (`scanmove::init`). */
  initBroadcast(e) {
    var o;
    const t = e.vars.Affordance;
    if (typeof t != "string" || t.trim() === "") return;
    const i = `${e.node.name ?? e.node.className ?? "?"}|${e.node.type}`;
    if (this.isScanMove(e.node)) {
      const s = t.trim(), a = f.broadcasts.probe(s, {
        x: this.x,
        y: this.y
      }), c = this.pendingScan;
      c && c.affordance === s && c.clientBehavior === this.varString(e, "Behavior") && c.serverBehavior === this.varString(e, "TargetBehavior") && (this.pendingScan = null, e.client = c.client), e.client ?? (e.client = f.broadcasts.tryConnect(
        s,
        { x: this.x, y: this.y },
        this.varString(e, "Behavior"),
        this.varString(e, "TargetBehavior"),
        f.animationConfig.scanDistancePx(this.mascotName) / this.spriteScale,
        this
      )), e.client ?? (e.client = f.broadcasts.tryReserve(
        s,
        { x: this.x, y: this.y },
        this.varString(e, "Behavior"),
        this.varString(e, "TargetBehavior"),
        this.varString(e, "BorderType"),
        this
      )), this.emit({
        kind: "milestone",
        name: (o = e.client) != null && o.reserved ? "broadcast-reserve" : e.client ? "broadcast-connect" : "broadcast-scan",
        detail: `affordance=${t} live=${a.live} nearest=${a.nearest === null ? "-" : this.toPage(a.nearest).toFixed(0)}px found=${!!e.client}`,
        affordance: s,
        side: "client",
        behavior: this.varString(e, "Behavior"),
        distance: a.nearest === null ? void 0 : this.toPage(a.nearest),
        x: this.x,
        y: this.y,
        leaf: i
      });
      return;
    }
    e.server = f.broadcasts.startBroadcast(t.trim(), {
      x: this.x,
      y: this.y
    }, this, (s) => this.acceptsInteraction(s), this.varString(e, "BorderType"));
    const n = { ...e.vars };
    delete n.Affordance, e.vars = n, this.emit({
      kind: "milestone",
      name: "broadcast-start",
      detail: `affordance=${t}`,
      affordance: t.trim(),
      side: "server",
      behavior: this.varString(e, "Behavior"),
      x: this.x,
      y: this.y,
      leaf: i
    });
  }
  /** libshijima `base::finalize()`: an action instance that ends stops advertising
   *  and hands its scan target back to the pool. */
  releaseFrame(e) {
    var t, i;
    e && ((t = e.server) == null || t.finalize(), e.server = null, (i = e.client) == null || i.finalize(), e.client = null);
  }
  releaseStack() {
    var e;
    (e = this.pendingScan) == null || e.client.finalize(), this.pendingScan = null;
    for (const t of this.actionStack) this.releaseFrame(t);
  }
  /**
   * Switch the mascot to a target behavior or action.
   *
   * @param name Target behavior or action name (e.g. "StandUp", "SitDown", "Dance").
   * @param optionsOrReason Configuration options or legacy string reason.
   * @param behaviorId Optional specific behavior entry id.
   * @returns `true` if the switch succeeded, `false` otherwise.
   */
  setBehavior(e, t, i, n) {
    var b, p, I;
    if (!this.config) return !1;
    const o = typeof t == "string", s = o ? { reason: t, force: !0 } : t ?? {};
    let a = s.reason ?? (o ? t : "manual-api");
    const c = s.force ?? !1, u = o ? !1 : s.snapToSurface ?? !!c, h = this.config.behaviors.some((k) => k.name === e), l = !!this.config.actions[e];
    if (!h && !l || !c && !this.canExecuteBehavior(e))
      return !1;
    if (!o && (this.pressActive || this.isDragging)) {
      if (this.activePointerId !== null) {
        try {
          (p = (b = this.elRoot).hasPointerCapture) != null && p.call(b, this.activePointerId) && this.elRoot.releasePointerCapture(this.activePointerId);
        } catch {
        }
        this.activePointerId = null;
      }
      this.pressActive = !1, this.hotspotHold = null, this.isDragging = !1, this.dragGrab = null, this.elRoot.style.cursor = "grab";
    }
    if (u) {
      const k = this.firstBorderOf(e);
      if (k && k !== re) {
        const x = this.area();
        if (k === "Floor")
          this.y = x.bottom, this.prevY = x.bottom, this.lastSurface = "floor", this.vx = 0, this.vy = 0;
        else if (k === "Wall") {
          const S = Math.abs(this.x - x.left), R = Math.abs(this.x - x.right);
          S <= R ? (this.x = x.left, this.prevX = x.left, this.lookRight = !1, this.lastSurface = "left-wall") : (this.x = x.right, this.prevX = x.right, this.lookRight = !0, this.lastSurface = "right-wall"), this.vx = 0, this.vy = 0;
        } else k === "Ceiling" && (this.y = x.top, this.prevY = x.top, this.lastSurface = "ceiling", this.vx = 0, this.vy = 0);
        this.constrainToWorkArea();
      }
    }
    if (!o)
      this.behaviorInitsThisTick = 0;
    else {
      if (this.behaviorInitsThisTick >= cn) {
        if (e === "StandUp") return !1;
        e = "StandUp", a = "init-limit";
      }
      this.behaviorInitsThisTick++;
    }
    const y = this.config.behaviors.find(
      (k) => k.name === e && (i === void 0 || k.id === i)
    ) || (this.config.actions[e] ? { name: e, frequency: 100, hidden: !1, nextBehaviors: [] } : void 0) || this.config.behaviors.find((k) => k.name === "StandUp") || this.config.behaviors[0];
    if (!y) return !1;
    const A = this.config.actions[y.name], g = ((I = this.currentBehavior) == null ? void 0 : I.name) ?? "", v = this.behaviorTicks;
    return this.behaviorTicks = 0, this.stillTicks = 0, A ? (this.interaction.available && !this.interaction.started && this.interaction.behavior === y.name && (this.interaction.started = !0), this.interaction.ongoing && y.name !== this.interaction.behavior && !a.startsWith("interaction-") && this.interaction.finalize(), this.releaseStack(), this.pendingScan = o ? this.reserveInteraction(y.name) ?? null : null, this.currentBehavior = y, this.interactionVisualActive = !!A && this.actionTreeMatches(A, (k) => this.isInteract(k)), this.interactionVisualActive && (this.elImg.style.visibility = "hidden", this.elImg.removeAttribute("src")), this.actionStack = [this.newFrame(A)], this.scrollFallRoot = null, this.scrollFallHeight = 0, this.emit({
      kind: "behavior",
      from: g,
      to: y.name,
      reason: a,
      selectionPolicy: n,
      restart: g === y.name,
      instance: ++this.behaviorInstance,
      tick: this.tickCount,
      entryId: y.id,
      previousTicks: v,
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    }), o || (this.actionExpansionsThisTick = 0, this.advanceActionTree(), this.renderNow()), !0) : (this.interactionVisualActive = !1, this.currentBehavior = y, this.onBehaviorEnd(a), !0);
  }
  loop(e) {
    if (!this.destroyed) {
      this.accumulator += Math.min(e - this.lastTime, hn), this.lastTime = e;
      try {
        for (this.applyScrollIntent(); this.accumulator >= T.tickMs; )
          this.tick(), this.accumulator -= T.tickMs;
        this.render(!this.isDragging);
      } catch (t) {
        this.accumulator = 0;
        const i = performance.now();
        i - this.lastTickErrorAt > 1e3 && (this.lastTickErrorAt = i, this.emit({
          kind: "milestone",
          name: "tick-error",
          detail: `${t instanceof Error ? t.name : "Error"}: ${t instanceof Error ? t.message : String(t)}`,
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }));
      }
      this.destroyed || (this.loopId = requestAnimationFrame((t) => this.loop(t)));
    }
  }
  tick() {
    if (!this.config || !this.actionStack.length) return;
    this.pressActive && (this.cursorButtons & 1 ? (this.updatePressMovement(), this.maintainHotspotHold()) : this.finishPress(this.cursorX, this.cursorY));
    const e = this.x, t = this.y;
    this.prevX = this.x, this.prevY = this.y, this.tickCount++;
    for (const o of this.actionStack)
      (o.node.type === "Sequence" || o.node.type === "Select") && o.elapsed++;
    this.behaviorInitsThisTick = 0, this.actionExpansionsThisTick = 0, this.applyScrollIntent();
    const i = nn / this.spriteScale;
    if (this.cursorTickDX = Math.max(
      -i,
      Math.min(
        i,
        (this.cursorX - this.lastTickCursorX) / this.spriteScale
      )
    ), this.cursorTickDY = Math.max(
      -i,
      Math.min(
        i,
        (this.cursorY - this.lastTickCursorY) / this.spriteScale
      )
    ), this.lastTickCursorX = this.cursorX, this.lastTickCursorY = this.cursorY, this.isDragging) {
      const o = this.actionStack[this.actionStack.length - 1];
      if (!this.isResistAction(o == null ? void 0 : o.node)) {
        this.applyDragAnchor();
        const s = this.simulationCursorVirtual();
        this.lookRight = !1, this.footDX = (this.footDX + (s.x - this.footX) * 0.1) * 0.8, this.footX += this.footDX;
      }
    }
    this.maintainBroadcasts(), this.tickStartVX = this.vx, this.tickStartVY = this.vy, this.isDragging || this.updatePhysics(), this.constrainToWorkArea(), this.advanceActionTree(), this.constrainToWorkArea(), this.behaviorTicks++;
    const n = Math.abs(this.x - e) + Math.abs(this.y - t) > 0.05;
    this.stillTicks = n ? 0 : this.stillTicks + 1, this.anchorStillTicks = n ? 0 : this.anchorStillTicks + 1, n && (this.wantMovement = !1), this.lastSurface = this.surfaceAt(), this.observeTick(e, t);
  }
  /**
   * libshijima `base::tick()` for every advertisement this mascot currently owns:
   * keep the advertised position current, and when somebody walked up to it, start
   * the behaviour the handshake asked for.
   */
  maintainBroadcasts() {
    var i;
    f.broadcasts.prune();
    let e = null, t = "";
    for (const n of this.actionStack) {
      const o = n.server;
      if (!o || (o.active && o.updateAnchor({ x: this.x, y: this.y }), o.isClaimed && !e && (e = o, t = ((i = n.node.attributes) == null ? void 0 : i.Affordance) ?? n.node.name ?? ""), !o.didMeetUp)) continue;
      this.interaction = o.interaction();
      const s = this.interaction.behavior;
      s && this.setBehavior(s, "interaction-server");
      return;
    }
    if (!e) {
      this.servingClaimSince = 0;
      return;
    }
    this.servingClaimSince === 0 && (this.servingClaimSince = this.tickCount), this.tickCount - this.servingClaimSince >= T.broadcastServeTimeoutTicks && (this.emit({
      kind: "milestone",
      name: "broadcast-serve-timeout",
      detail: `affordance=${t} waited=${this.tickCount - this.servingClaimSince} ticks`,
      affordance: t,
      side: "server",
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    }), e.finalize(), this.servingClaimSince = 0);
  }
  /**
   * Is this frame the advertisement of a claim that has not arrived yet, and is the
   * wait still within its bound? While it is true the frame must not end and the
   * pacer must not pull the mascot away, otherwise the scanner loses its partner
   * mid-approach. Everything else (a drag, a scroll, a forced `Fall`) still releases
   * the advertisement the normal way — only the advertisement's *own* animation
   * ending is deferred.
   */
  holdingClaim(e) {
    const t = e == null ? void 0 : e.server;
    return !t || !t.isClaimed ? !1 : this.servingClaimSince === 0 ? !0 : this.tickCount - this.servingClaimSince < T.broadcastServeTimeoutTicks;
  }
  /** Scheduling intent, consumed only after a behavior or a whole indefinite
   * loop completes. Deriving it from the clocks also preserves relay snapshots. */
  behaviorSwitchReason() {
    var n, o;
    const e = f.animationConfig;
    if (this.isDragging || this.interaction.ongoing || this.interactionVisualActive || this.isFallLike(this.currentLeaf()) || ((n = this.currentBehavior) == null ? void 0 : n.name) === "Dragged" || this.holdingClaim(this.actionStack[this.actionStack.length - 1]))
      return null;
    const t = e.forcedSwitchTicks(this.mascotName);
    if (t > 0 && this.stillTicks >= t && !this.isTravelling() && e.pacerApplies(this.mascotName, (o = this.currentBehavior) == null ? void 0 : o.name))
      return "forced-switch";
    const i = e.maxBehaviorTicks(this.mascotName);
    return i > 0 && this.behaviorTicks >= i ? "behavior-cap" : null;
  }
  observeScheduledSwitch(e) {
    var t;
    this.emit({
      kind: "milestone",
      name: e,
      detail: `behavior=${((t = this.currentBehavior) == null ? void 0 : t.name) ?? "?"} behaviorTicks=${this.behaviorTicks} anchorStill=${this.anchorStillTicks}${this.wantMovement ? " force-travel" : ""}`,
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    });
  }
  /** Is the mascot currently going somewhere? Travel is not idle. */
  isTravelling() {
    const e = this.currentLeaf(), t = this.actionStack[this.actionStack.length - 1];
    if (!e || !t) return !1;
    if (e.type === "Move" || this.isScanMove(e) || this.varNumber(t, "TargetX") !== null || this.varNumber(t, "TargetY") !== null)
      return !0;
    const i = this.currentPose();
    return !!i && (i.velocity.x !== 0 || i.velocity.y !== 0);
  }
  /** Feed the observation stream: stack/frame changes and impossible steps.
   *  Runs once per logic tick and does nothing when nobody is listening. */
  observeTick(e, t) {
    if (!f.observers.size) return;
    const i = this.leafLabel(), n = this.currentImage(), o = this.stackPath();
    if (o !== this.observedPath) {
      this.observedPath = o;
      const h = this.currentLeaf(), l = this.actionStack[this.actionStack.length - 1];
      this.emit({
        kind: "stack",
        path: o,
        leaf: i,
        nodeType: (h == null ? void 0 : h.type) ?? "-",
        className: (h == null ? void 0 : h.className) ?? "",
        border: (h == null ? void 0 : h.borderType) ?? "",
        targetX: this.varNumber(l, "TargetX"),
        targetY: this.varNumber(l, "TargetY"),
        image: n,
        lookRight: this.lookRight,
        x: this.x,
        y: this.y
      });
    }
    n !== this.observedImage && (this.observedImage = n, this.emit({ kind: "image", image: n, leaf: i, x: this.x, y: this.y }));
    const s = Math.hypot(this.x - e, this.y - t), a = this.currentPose(), c = Math.abs(this.vx) + Math.abs(this.vy) + Math.abs(this.tickStartVX) + Math.abs(this.tickStartVY) + (a ? Math.abs(a.velocity.x) + Math.abs(a.velocity.y) : 0), u = this.isDragging || this.offsetJumped || s <= c + T.suspectStepPx;
    this.offsetJumped = !1, s > T.suspectStepPx && !u && this.emit({
      kind: "suspect",
      name: "position-jump",
      detail: `single-tick step=${s.toFixed(1)}`,
      step: s,
      dx: this.x - e,
      dy: this.y - t,
      px: e,
      py: t,
      x: this.x,
      y: this.y,
      leaf: i
    });
  }
  activeAnimation(e) {
    const t = e.node.animations || [];
    return t.find(
      (i) => this.evaluateCondition(i.condition, e)
    ) || t[0];
  }
  advanceActionTree() {
    var s, a, c, u, h;
    const e = this.actionStack[this.actionStack.length - 1];
    if (!e || !this.config) return;
    if (++this.actionExpansionsThisTick > ve) {
      this.emit({
        kind: "milestone",
        name: "action-expansion-limit",
        detail: `>${ve} expansions in one tick`,
        x: this.x,
        y: this.y,
        leaf: this.leafLabel()
      }), this.popActionStack();
      return;
    }
    const t = e.node;
    if (t.type === "ActionReference") {
      if (!this.frameConditionsSatisfied(e)) {
        this.popActionStack();
        return;
      }
      if (!t.referenceName) {
        this.popActionStack();
        return;
      }
      const l = this.config.actions[t.referenceName];
      if (!l) {
        this.popActionStack();
        return;
      }
      const d = t.attributes || {}, y = { ...e.vars, ...d }, A = {
        ...e.resolved,
        ...this.resolveVars(d, e.resolved)
      };
      this.clampTravelTarget(A);
      const g = this.newFrame(
        l,
        y,
        A,
        e.parentIndex,
        e.referenceDepth + 1,
        e
      ), v = f.animationConfig.durationTicks(
        this.mascotName,
        t.referenceName
      );
      v !== null ? g.durationLimit = v : l.type === "Stay" ? g.durationLimit = this.holdDuration(g) : g.durationLimit = null, this.actionStack[this.actionStack.length - 1] = g;
      const b = this.varNumber(g, "InitialVX"), p = this.varNumber(g, "InitialVY");
      b !== null && (this.vx = b), p !== null && (this.vy = p);
      const I = this.varValue(g, "LookRight");
      return typeof I == "boolean" && (this.lookRight = I), this.advanceActionTree();
    }
    if (!this.frameConditionsSatisfied(e)) {
      this.popActionStack();
      return;
    }
    if ((t.type === "Sequence" || t.type === "Select") && e.durationLimit === null && (e.durationLimit = f.animationConfig.durationTicks(this.mascotName, t.name)), t.type === "Select") {
      if (e.childIndex > 0) {
        this.popActionStack();
        return;
      }
      e.childIndex = 1;
      const l = t.children || [];
      let d;
      for (let y = 0; y < l.length; y++) {
        const A = this.childFrame(e, l[y], y);
        if (this.frameConditionsSatisfied(A)) {
          d = A;
          break;
        }
        this.releaseFrame(A);
      }
      return d ? this.actionStack.push(d) : this.popActionStack(), this.advanceActionTree();
    }
    if (t.type === "Sequence") {
      const l = t.children || [];
      for (; e.childIndex < l.length; ) {
        const d = l[e.childIndex++], y = this.childFrame(e, d, e.childIndex - 1);
        if (!this.frameConditionsSatisfied(y)) {
          this.releaseFrame(y);
          continue;
        }
        return this.actionStack.push(y), this.advanceActionTree();
      }
      if (t.loop && !(e.durationLimit !== null && e.elapsed >= e.durationLimit) && !this.behaviorSwitchReason())
        return e.childIndex = 0, this.advanceActionTree();
      this.popActionStack();
      return;
    }
    if (t.className && !mt.has(t.className) && (t.className.endsWith(".ThrowIE") || t.className.endsWith(".ThrowWindow") || t.className.endsWith(".WalkWithIE") || t.className.endsWith(".PullWindow") || t.className.endsWith(".FallWithIE") || t.className.endsWith(".Breed") || t.className.endsWith(".Divide")) && (mt.add(t.className), console.warn(
      `[web-mascot] Action "${t.name ?? t.className}" uses desktop-specific class "${t.className}", which is gracefully degraded on web.`
    )), (s = t.className) != null && s.endsWith(".Look") || t.name === "Look") {
      const l = this.varValue(e, "LookRight");
      this.lookRight = typeof l == "boolean" ? l : !this.lookRight, this.popActionStack();
      return;
    }
    if ((a = t.className) != null && a.endsWith(".Offset") || t.name === "Offset") {
      const l = Math.trunc(this.varNumber(e, "X") ?? 0), d = Math.trunc(this.varNumber(e, "Y") ?? 0);
      this.x += l, this.y += d, (l !== 0 || d !== 0) && (this.offsetJumped = !0, this.emit({
        kind: "milestone",
        name: "offset",
        detail: `d=(${l},${d}) sprite px = (${this.toPage(l).toFixed(1)},${this.toPage(d).toFixed(1)}) page px`,
        x: this.x,
        y: this.y,
        leaf: this.leafLabel()
      })), this.popActionStack();
      return;
    }
    if (this.isScanMove(t) && !(e.client && e.client.connected)) {
      e.client && this.emit({
        kind: "milestone",
        name: "broadcast-abort",
        detail: `affordance=${e.vars.Affordance ?? "-"} partner stopped advertising`,
        affordance: e.vars.Affordance,
        side: "client",
        behavior: this.varString(e, "Behavior"),
        x: this.x,
        y: this.y,
        leaf: this.leafLabel()
      }), this.popActionStack();
      return;
    }
    if (this.isInteract(t) && (!this.interaction.available || !this.interaction.started || !this.interaction.ongoing)) {
      this.popActionStack();
      return;
    }
    if (this.isInteract(t) && (this.interactionCooldownUntil = this.tickCount + f.animationConfig.interactionCooldown(this.mascotName)), this.isDraggedAction(t)) {
      if (!this.isDragging) {
        this.setBehavior("Thrown", "drag-release");
        return;
      }
      if (Math.abs(this.cursorTickDX) >= rn ? this.dragStillTicks = 0 : this.dragStillTicks++, this.dragStillTicks >= T.dragResistTicks) {
        this.emit({
          kind: "milestone",
          name: "drag-resist",
          detail: `held still for ${T.dragResistTicks} ticks`,
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.popActionStack();
        return;
      }
    }
    if (this.isResistAction(t) && Math.abs(this.simulationCursorVirtual().x - this.x) >= T.dragResistAbortPx) {
      this.dragStillTicks = 0, this.setBehavior("Dragged", "resist-abort");
      return;
    }
    if (e.bornTick === this.tickCount) return;
    const i = this.activeAnimation(e);
    i && e.animation !== i && (e.animation = i, e.poseIndex = 0, e.poseTick = 0);
    const n = (i == null ? void 0 : i.poses) || t.poses || [];
    if (!n.length) {
      this.popActionStack();
      return;
    }
    if (e.durationLimit === null) {
      const l = f.animationConfig.durationTicks(
        this.mascotName,
        t.name
      );
      l !== null ? e.durationLimit = l : t.type === "Stay" && (e.durationLimit = this.holdDuration(e));
    }
    if (e.elapsed++, e.poseTick++, e.durationLimit !== null && e.elapsed >= e.durationLimit && (!(t.loop || e.finishCycle) || e.poseIndex === n.length - 1 && e.poseTick >= (((c = e.poseDurations) == null ? void 0 : c[e.poseIndex]) ?? Math.max(1, n[e.poseIndex].duration))) && !this.holdingClaim(e)) {
      this.popActionStack();
      return;
    }
    const o = n[e.poseIndex] ?? n[0];
    if (!o) {
      this.popActionStack();
      return;
    }
    if (e.poseTick >= (((u = e.poseDurations) == null ? void 0 : u[e.poseIndex]) ?? Math.max(1, o.duration)) && (e.poseTick = 0, e.poseIndex++, e.poseIndex >= n.length)) {
      if (e.poseIndex = 0, this.isResistAction(t)) {
        this.endDrag(), this.emit({
          kind: "milestone",
          name: "resist-escape",
          detail: "struggle finished, mascot broke free",
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.setBehavior("Thrown", "resist-escape");
        return;
      }
      const l = this.isFallLike(t) || this.isJumpLike(t) && this.hasTarget(e), d = this.isScanMove(t) && !!((h = e.client) != null && h.connected), y = t.loop && e.durationLimit === null && !this.hasTarget(e) && !l && !this.isInteract(t) && !this.isDraggedAction(t) && !d && !this.holdingClaim(e) && this.behaviorSwitchReason() !== null;
      if ((!t.loop || y) && !this.isDraggedAction(t) && !d && !this.holdingClaim(e) && !this.hasTarget(e) && e.durationLimit === null && !l) {
        const A = this.isInteract(t) ? this.varString(e, "Behavior") : "";
        if (A) {
          this.setBehavior(A, "interact-behavior");
          return;
        }
        this.popActionStack();
      }
    }
  }
  popActionStack() {
    const e = this.actionStack.pop();
    this.releaseFrame(e), this.actionStack.length || (this.interaction.finalize(), this.onBehaviorEnd("behavior-end"));
  }
  currentPose() {
    const e = this.actionStack[this.actionStack.length - 1];
    if (!e) return;
    const t = this.activeAnimation(e), i = (t == null ? void 0 : t.poses) || e.node.poses || [];
    return i[e.poseIndex] || i[0];
  }
  currentLeaf() {
    var e;
    return (e = this.actionStack[this.actionStack.length - 1]) == null ? void 0 : e.node;
  }
  borderTypeSatisfied(e) {
    const t = this.environment(), i = { x: this.x, y: this.y };
    return e ? e === "Floor" ? t.floor.isOn(i) : e === "Wall" ? t.wall.isOn(i) : e === "Ceiling" ? t.ceiling.isOn(i) : !1 : !0;
  }
  /** Actions that end when they touch the floor. `Thrown`/`Fall` are Sequence
   *  behaviours whose Falling child does the physics, so only the fall action
   *  itself (and the embedded Fall class) counts here. */
  isFallLike(e) {
    var t, i;
    return e ? !!((t = e.className) != null && t.endsWith(".Fall")) || !!((i = e.className) != null && i.endsWith(".FallWithIE")) || e.name === "Falling" : !1;
  }
  /** Actions that end when they reach their target. */
  isJumpLike(e) {
    var t;
    return e ? !!((t = e.className) != null && t.endsWith(".Jump")) || e.name === "Jumping" : !1;
  }
  /** An action with a usable TargetX/TargetY runs until it arrives there, so its
   *  animation must be allowed to loop instead of ending the action.
   *
   *  The value is what counts, not the presence of the attribute: the packs
   *  contain a broken target expression (`Math.random*100` in ClimbAlongWall)
   *  that evaluates to NaN. Treating "attribute present" as "seeking a target"
   *  while the movement code sees no target made the action impossible to
   *  finish, which left the mascot pressed against a border for ever. */
  hasTarget(e) {
    return this.varNumber(e, "TargetX") !== null || this.varNumber(e, "TargetY") !== null;
  }
  /** libshijima's action classes for the drag: `Pinched` is `...Dragged` (follows
   *  the cursor and times the struggle) and `Resisting` is `...Regist` (breaks free). */
  isDraggedAction(e) {
    var t;
    return !!((t = e == null ? void 0 : e.className) != null && t.endsWith(".Dragged"));
  }
  isResistAction(e) {
    var t;
    return !!((t = e == null ? void 0 : e.className) != null && t.endsWith(".Regist"));
  }
  /** `com.group_finity.mascot.action.Offset` — an instant anchor translation. */
  isOffsetAction(e) {
    var t;
    return !!e && (((t = e.className) == null ? void 0 : t.endsWith(".Offset")) === !0 || e.name === "Offset");
  }
  /** Affordance actions. The scan side (`ScanMove`) walks to somebody else's
   *  advertisement; the interaction side (`Interact`) runs alongside the partner. */
  isScanMove(e) {
    var t;
    return !!((t = e == null ? void 0 : e.className) != null && t.endsWith(".ScanMove"));
  }
  isInteract(e) {
    var t;
    return !!((t = e == null ? void 0 : e.className) != null && t.endsWith(".Interact"));
  }
  /** Actions whose mascot-level feature this port does not implement. */
  isUnsupportedAction(e) {
    var t, i;
    return !!((t = e == null ? void 0 : e.className) != null && t.endsWith(".Breed")) || !!((i = e == null ? void 0 : e.className) != null && i.endsWith(".Divide"));
  }
  actionTreeMatches(e, t, i = /* @__PURE__ */ new Set()) {
    var n;
    if (i.has(e)) return !1;
    if (i.add(e), t(e)) return !0;
    if (e.type === "ActionReference" && e.referenceName) {
      const o = (n = this.config) == null ? void 0 : n.actions[e.referenceName];
      if (o && this.actionTreeMatches(o, t, i))
        return !0;
    }
    for (const o of e.children || [])
      if (this.actionTreeMatches(o, t, i)) return !0;
    return !1;
  }
  /**
   * Which border a behaviour *starts* on: the first `BorderType` its action tree
   * requires, in the order libshijima evaluates them. Returns `FLEXIBLE_BORDER` when
   * an `Offset` comes first (the behaviour can begin anywhere), or `null` when the
   * behaviour needs no border at all.
   */
  firstBorderOf(e) {
    var o;
    const t = this.borderStartCache.get(e);
    if (t !== void 0) return t;
    const i = (o = this.config) == null ? void 0 : o.actions[e], n = i ? this.firstBorderInTree(i, /* @__PURE__ */ new Set()) : null;
    return this.borderStartCache.set(e, n), n;
  }
  firstBorderInTree(e, t) {
    var n, o;
    if (t.has(e)) return null;
    t.add(e);
    const i = (n = e.attributes) == null ? void 0 : n.BorderType;
    if (typeof i == "string" && i.trim() !== "") return i.trim();
    if (this.isOffsetAction(e)) return re;
    if (e.type === "ActionReference" && e.referenceName) {
      const s = (o = this.config) == null ? void 0 : o.actions[e.referenceName];
      if (s) {
        const a = this.firstBorderInTree(s, t);
        if (a) return a;
      }
    }
    for (const s of e.children || []) {
      const a = this.firstBorderInTree(s, t);
      if (a) return a;
    }
    return null;
  }
  /** A border the mascot is standing on right now, other than the one it just lost. */
  currentBorderAt(e) {
    const t = this.surfaceAt(), i = t === "floor" ? "Floor" : t === "ceiling" ? "Ceiling" : t ? "Wall" : null;
    if (i && i !== e) return i;
    const n = { x: this.x, y: this.y }, o = this.area();
    return e !== "Floor" && this.borderIsOn("bottom", n, o) ? "Floor" : e !== "Wall" && (this.borderIsOn("left", n, o) || this.borderIsOn("right", n, o)) ? "Wall" : e !== "Ceiling" && this.borderIsOn("top", n, o) ? "Ceiling" : null;
  }
  /** The surface currently supporting the anchor, preserving the active side at corners. */
  surfaceAt(e = { x: this.x, y: this.y }, t = this.area()) {
    var u;
    const i = this.currentLeaf();
    if (this.isDragging || this.isFallLike(i) || this.isJumpLike(i) || this.isDraggedAction(i))
      return null;
    const n = this.borderIsOn("bottom", e, t), o = this.borderIsOn("left", e, t), s = this.borderIsOn("right", e, t), a = this.borderIsOn("top", e, t), c = (u = this.currentLeaf()) == null ? void 0 : u.borderType;
    return c === "Floor" && n ? "floor" : c === "Wall" && (o || s) ? o ? "left-wall" : "right-wall" : c === "Ceiling" && a ? "ceiling" : this.lastSurface === "floor" && n ? "floor" : this.lastSurface === "left-wall" && o ? "left-wall" : this.lastSurface === "right-wall" && s ? "right-wall" : this.lastSurface === "ceiling" && a ? "ceiling" : n ? "floor" : o ? "left-wall" : s ? "right-wall" : a ? "ceiling" : null;
  }
  /** Rebase the viewport frame without feeding camera motion into the integrator. */
  applyScrollIntent() {
    var a;
    const e = this.scrollDetachPending, t = this.pendingScrollShift;
    if (this.scrollDetachPending = null, this.pendingScrollShift = 0, this.isDragging || !e && t === 0) return;
    const i = this.surfaceAt();
    if (this.scrollFloorBlocked && i === "floor" && t > 0 || (e && i === e && (i !== "floor" || t > 0) && (this.vx = this.vy = 0, this.lastSurface = null, this.setBehavior("Fall", "scroll-detach"), this.advanceActionTree(), i === "floor" && this.isFallLike(this.currentLeaf()) && (this.scrollFallRoot = this.actionStack[0] ?? null, this.scrollFallHeight = 0)), t === 0)) return;
    if (this.scrollSquashEnabled && t < 0) {
      const c = this.currentLeaf();
      if (this.surfaceAt() === "floor" && !this.isDragging && !this.isFallLike(c) && !this.interactionVisualActive) {
        const h = (c == null ? void 0 : c.name) || "", d = h.includes("Sit") || h.includes("Lie") || h.includes("Crawl") || h.includes("Sprawl") ? 0.5 : 1, y = Math.min(0.5, Math.abs(t) / 30 * d);
        this.squashAmount = Math.min(1, this.squashAmount + y);
      }
    }
    const n = this.y, o = this.x;
    this.y -= t, this.prevY -= t, this.offsetJumped = !0;
    const s = this.area();
    if (this.scrollFallRoot === this.actionStack[0] && (this.scrollFallHeight = Math.max(
      this.scrollFallHeight,
      (s.bottom - this.y) * this.spriteScale
    )), this.y >= s.bottom)
      if (this.isFallLike(this.currentLeaf()) && n < s.bottom) {
        const c = n < this.y ? (s.bottom - n) / (this.y - n) : 0, u = Math.max(
          s.left,
          Math.min(s.right, o + (this.x - o) * c)
        );
        this.x = u, this.y = this.prevY = s.bottom, this.vx = this.vy = 0, this.isScrollStartContact() || (this.protectScrollLanding(), this.emit({
          kind: "milestone",
          name: "land",
          detail: "downward floor crossing",
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.graceAfterScrollLanding(), this.finishFloorLanding());
      } else
        this.y = this.prevY = s.bottom, (this.isFallLike(this.currentLeaf()) || this.isJumpLike(this.currentLeaf())) && (this.vx = this.vy = 0, this.graceAfterScrollLanding(), this.settleAfterLanding(), this.setBehavior("StandUp", "scroll-floor-support"), this.advanceActionTree());
    this.constrainToWorkArea(), this.prevY = Math.min(s.bottom, this.prevY), ((a = this.currentBehavior) == null ? void 0 : a.name) !== "Fall" && (this.prevY = Math.max(s.top, this.prevY));
  }
  /** Can this behaviour actually move the mascot? Used to guarantee that the
   *  mascot goes somewhere after standing still for a while. */
  canTravel(e) {
    const t = this.travelStructure(e);
    return t.moves ? !0 : t.scans ? this.hasReachableInteractionOpportunity(e) : !1;
  }
  /** Structural part of `canTravel`: does the tree contain a Move / a ScanMove? */
  travelStructure(e) {
    var o;
    const t = this.travelCache.get(e);
    if (t) return t;
    const i = (o = this.config) == null ? void 0 : o.actions[e], n = {
      moves: i ? this.actionTreeMatches(i, (s) => s.type === "Move") : !1,
      scans: i ? this.actionTreeMatches(i, (s) => this.isScanMove(s)) : !1
    };
    return this.travelCache.set(e, n), n;
  }
  /** Does this behaviour only make sense with a second mascot around? */
  needsPartnerToAct(e) {
    var o;
    const t = this.partnerCache.get(e);
    if (t !== void 0) return t;
    const i = (o = this.config) == null ? void 0 : o.actions[e];
    let n = !1;
    return i && (n = this.actionTreeMatches(
      i,
      (s) => {
        var a;
        return this.isScanMove(s) || this.isInteract(s) || typeof ((a = s.attributes) == null ? void 0 : a.Affordance) == "string" && s.attributes.Affordance !== "";
      }
    )), this.partnerCache.set(e, n), n;
  }
  /**
   * Selection weight after the configuration:
   *   1. an explicit `behaviorWeights` entry for this behaviour wins;
   *   2. a partner behaviour uses `partnerWeights` (alone / with partner), so the
   *      pack's 1000–3000 weights do not turn a lone page mascot into a statue;
   *   3. otherwise the pack's own Frequency.
   */
  effectiveWeight(e, t) {
    const i = f.animationConfig, n = this.interactionRoles(e);
    if (n.scans.length && !this.hasReachableInteractionOpportunity(e) || n.offers.length && !n.scans.length && ![...f.liveEngines].some((s) => {
      var a;
      return s !== this && ((a = s.config) == null ? void 0 : a.behaviors.some((c) => s.behaviorUsable(c) && i.allows(s.mascotName, c.name) && (i.weightOverride(s.mascotName, c.name) ?? c.frequency) > 0 && s.interactionRoles(c.name).scans.some((u) => n.offers.includes(u.affordance) && this.acceptsInteraction(u.serverBehavior) && s.acceptsInteraction(u.clientBehavior))));
    }) || this.needsPartnerToAct(e) && this.tickCount < this.interactionCooldownUntil) return 0;
    const o = i.weightOverride(this.mascotName, e);
    if (o !== void 0) return o;
    if (this.needsPartnerToAct(e)) {
      if (this.tickCount < this.interactionCooldownUntil) return 0;
      const s = i.partnerWeight(
        this.mascotName,
        f.liveEngines.size > 1,
        this.partnerReachable()
      );
      if (s !== null) return s;
    }
    return t;
  }
  /**
   * Is another mascot somewhere a scan could succeed right now? Mirrors the two
   * positional gates in `BroadcastManager.tryConnect`: the same surface (|Δy| ≤ 1)
   * and within the scan distance. Two mascots both walking the floor are "reachable",
   * one on the floor and one on the ceiling are not — which is what makes
   * `partnerWeights.reachable` boost exactly the hugs that can actually happen.
   */
  partnerReachable() {
    const e = f.animationConfig.scanDistancePx(this.mascotName) / this.spriteScale;
    for (const t of f.liveEngines)
      if (t !== this && !(Math.abs(t.y - this.y) > 1) && !(Math.abs(t.x - this.x) > e))
        return !0;
    return !1;
  }
  acceptsInteraction(e) {
    var t;
    return !!((t = this.config) != null && t.actions[e]) && f.animationConfig.allows(this.mascotName, e);
  }
  /** Read the roles from the action tree, including ActionReference overlays. */
  interactionRoles(e) {
    var s;
    const t = [], i = [], n = (a, c = {}, u = /* @__PURE__ */ new Set()) => {
      var d;
      if (u.has(a)) return;
      const h = new Set(u).add(a), l = { ...a.attributes, ...c };
      if (a.type === "ActionReference") {
        const y = (d = this.config) == null ? void 0 : d.actions[a.referenceName ?? ""];
        y && n(y, l, h);
        return;
      }
      l.Affordance && (this.isScanMove(a) ? i.push({ affordance: l.Affordance.trim(), clientBehavior: l.Behavior ?? "", serverBehavior: l.TargetBehavior ?? "" }) : t.push(l.Affordance.trim()));
      for (const y of a.children ?? []) n(y, {}, h);
    }, o = (s = this.config) == null ? void 0 : s.actions[e];
    return o && n(o), { offers: t, scans: i };
  }
  hasInteractionOpportunity(e) {
    return this.interactionRoles(e).scans.some((t) => this.acceptsInteraction(t.clientBehavior) && !!f.broadcasts.findAvailable(
      t.affordance,
      { x: this.x, y: this.y },
      f.animationConfig.scanDistancePx(this.mascotName) / this.spriteScale,
      this,
      t.serverBehavior
    ));
  }
  /** Candidate lookup used by scheduling: a compatible same-surface offer can be
   * approached by the ScanMove action even when it is outside direct scan range. */
  hasReachableInteractionOpportunity(e) {
    return this.hasInteractionOpportunity(e) || this.interactionRoles(e).scans.some((t) => this.acceptsInteraction(t.clientBehavior) && !!f.broadcasts.findReachable(
      t.affordance,
      { x: this.x, y: this.y },
      this.firstBorderOf(e) ?? void 0,
      this,
      t.serverBehavior
    ));
  }
  reserveInteraction(e) {
    for (const t of this.interactionRoles(e).scans) {
      if (!this.acceptsInteraction(t.clientBehavior)) continue;
      const i = f.broadcasts.tryConnect(
        t.affordance,
        { x: this.x, y: this.y },
        t.clientBehavior,
        t.serverBehavior,
        f.animationConfig.scanDistancePx(this.mascotName) / this.spriteScale,
        this
      );
      if (i) return { ...t, client: i };
      const n = f.broadcasts.tryReserve(
        t.affordance,
        { x: this.x, y: this.y },
        t.clientBehavior,
        t.serverBehavior,
        this.firstBorderOf(e) ?? void 0,
        this
      );
      if (n) return { ...t, client: n };
    }
  }
  /** A behavior can only be offered when its action is present and this engine
   *  can actually carry it out. */
  behaviorUsable(e) {
    var o;
    const t = this.behaviorUsability.get(e.name);
    if (t !== void 0) return t;
    const i = (o = this.config) == null ? void 0 : o.actions[e.name];
    let n = !!i;
    return i && this.actionTreeMatches(i, (s) => this.isUnsupportedAction(s)) && (n = !1), this.behaviorUsability.set(e.name, n), n;
  }
  /** Stop an action that keeps trying to move but never gets anywhere: a target
   *  it can never reach, or a border it is pressed against. */
  guardStall(e) {
    var n;
    if (!e) return;
    const t = this.currentPose(), i = ((n = this.activeAnimation(e)) == null ? void 0 : n.poses) ?? e.node.poses ?? [];
    if (!(!t || t.velocity.x === 0 && t.velocity.y === 0 && (e.durationLimit !== null || i.some((o) => o.velocity.x !== 0 || o.velocity.y !== 0)))) {
      if (e.progressX === this.x && e.progressY === this.y) {
        e.stallTicks++, e.stallTicks >= tn && this.popActionStack();
        return;
      }
      e.progressX = this.x, e.progressY = this.y, e.stallTicks = 0;
    }
  }
  /** Apply the configuration's duration multiplier to a pack hold time. */
  scaledTicks(e) {
    return Math.max(
      1,
      Math.round(e * f.animationConfig.scale(this.mascotName))
    );
  }
  /** Reschedule only explicitly identified idle waits, preserving all pose order
   * and performance timing. Unknown actions and short transitions keep XML timing. */
  holdDuration(e) {
    var c, u, h;
    const t = this.scaledTicks(this.varNumber(e, "Duration") ?? T.stayDurationTicks), i = f.animationConfig.holdLimitTicks(this.mascotName, e.node.name);
    if (i === null || i >= t || this.interactionVisualActive || this.interaction.ongoing || this.hasTarget(e) || this.isInteract(e.node) || this.isDraggedAction(e.node) || this.isResistAction(e.node)) return t;
    const n = (c = f.animationConfig.optionsFor(this.mascotName).actionHoldLimits) == null ? void 0 : c[e.node.name ?? ""];
    if (!n || (u = e.node.animations) != null && u.some((l) => l.condition)) return t;
    const o = ((h = this.activeAnimation(e)) == null ? void 0 : h.poses) ?? e.node.poses ?? [];
    if (o.some((l) => l.velocity.x !== 0 || l.velocity.y !== 0)) return t;
    const s = yi(o.map((l) => l.duration), n.waitPoses, i);
    if (!s) return t;
    const a = s.reduce((l, d) => l + d, 0);
    return a >= t ? t : (e.poseDurations = s, e.finishCycle = !0, this.emit({
      kind: "milestone",
      name: "idle-timing",
      detail: `action=${e.node.name} requested=${i} effective=${a} original=${t}`,
      x: this.x,
      y: this.y,
      leaf: `${e.node.name}|${e.node.type}`
    }), a);
  }
  /**
   * `maxTravelPx`: pull a wander target in so the mascot stays near where it is.
   *
   * Targets that point exactly at a border are left alone — the packs use those to
   * send a mascot to a wall ("walk to the right edge, then climb"), and clamping
   * them would break the sequence that follows. Interior targets are the "wander
   * somewhere" kind, and those are what would otherwise cross the whole page.
   */
  clampTravelTarget(e) {
    const t = f.animationConfig.maxTravelPx(this.mascotName) / this.spriteScale;
    if (t <= 0) return;
    const i = this.area(), n = e.TargetX;
    typeof n != "number" || !Number.isFinite(n) || n <= i.left + 0.5 || n >= i.right - 0.5 || (e.TargetX = Math.max(
      this.x - t,
      Math.min(this.x + t, n)
    ));
  }
  updatePhysics() {
    var u, h, l, d, y;
    const e = this.currentLeaf();
    if (!e) return;
    if (e.borderType && !this.borderTypeSatisfied(e.borderType)) {
      this.emit({
        kind: "milestone",
        name: "border-lost",
        detail: `BorderType=${e.borderType} not satisfied`,
        x: this.x,
        y: this.y,
        leaf: this.leafLabel()
      });
      const A = this.currentBorderAt(e.borderType);
      if (A) {
        this.onBehaviorEnd(`border-change:${e.borderType}->${A}`);
        return;
      }
      this.setBehavior("Fall", `border-lost:${e.borderType}`);
      return;
    }
    const t = this.actionStack[this.actionStack.length - 1], i = this.currentPose(), n = this.varNumber(t, "TargetX"), o = this.varNumber(t, "TargetY");
    if (this.isScanMove(e)) {
      const A = t == null ? void 0 : t.client;
      if (!A || !A.connected) return;
      const g = A.target;
      if (!g) return;
      if (Math.abs(g.y - this.y) > 1) {
        A.finalize();
        return;
      }
      const v = this.x;
      if (i && i.velocity.x !== 0 && (this.lookRight = i.velocity.x > 0 ? g.x < this.x : g.x > this.x, this.x += (this.lookRight ? -1 : 1) * i.velocity.x), v <= g.x && this.x >= g.x || v >= g.x && this.x <= g.x) {
        this.x = g.x, A.notifyArrival(), A.reserved && this.emit({
          kind: "milestone",
          name: "broadcast-connect",
          detail: `affordance=${t.vars.Affordance ?? "-"} reserved target reached`,
          affordance: t.vars.Affordance,
          side: "client",
          behavior: this.varString(t, "Behavior"),
          distance: 0,
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.interaction = A.interaction();
        const p = this.interaction.behavior;
        this.emit({
          kind: "milestone",
          name: "interaction-arrived",
          detail: `partner=(${this.toPage(g.x).toFixed(1)},${this.toPage(g.y).toFixed(1)}) behavior=${p || "-"}`,
          behavior: p || void 0,
          target: [this.toPage(g.x), this.toPage(g.y)],
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.setBehavior(p || "StandUp", "interaction-client");
        return;
      }
      this.guardStall(t);
      return;
    }
    if (this.isFallLike(e)) {
      if (this.y === this.area().bottom && this.vy >= 0 && this.borderTypeSatisfied("Floor")) {
        if (this.vx = this.vy = 0, this.isScrollStartContact()) return;
        this.setBehavior("StandUp", "floor-supported"), this.advanceActionTree();
        return;
      }
      const A = this.area(), g = this.borderIsOn("left", { x: this.x, y: this.y }, A), v = this.borderIsOn("right", { x: this.x, y: this.y }, A);
      if (((u = this.currentBehavior) == null ? void 0 : u.name) !== "Fall" && this.y < A.bottom && (g && this.vx <= 0 || v && this.vx >= 0)) {
        const S = g ? "left-wall" : "right-wall";
        this.x = S === "left-wall" ? A.left : A.right, this.vx = this.vy = 0, this.lookRight = S === "right-wall", this.lastSurface = S, this.setBehavior("HoldOntoWall", "wall-supported"), this.advanceActionTree();
        return;
      }
      const b = this.evaluateNumber((h = e.attributes) == null ? void 0 : h.RegistanceX, t) ?? T.resistanceX, p = this.evaluateNumber((l = e.attributes) == null ? void 0 : l.RegistanceY, t) ?? T.resistanceY, I = this.evaluateNumber((d = e.attributes) == null ? void 0 : d.Gravity, t) ?? T.gravity;
      this.vx -= this.vx * b, this.vy += I - this.vy * p;
      const k = this.x, x = this.y;
      if (this.x += this.vx, this.y += this.vy, this.grabImpactSurface(k, x)) return;
      this.landOnFloor(k, x) && this.finishFloorLanding();
      return;
    }
    if (this.isJumpLike(e) && n !== null && o !== null) {
      const A = n - this.x, g = o - this.y - Math.abs(A), v = Math.hypot(A, g), b = this.evaluateNumber((y = e.attributes) == null ? void 0 : y.VelocityParam, t) ?? 20;
      if (this.lookRight = A > 0, v <= b) {
        this.x = n, this.y = o, this.emit({
          kind: "milestone",
          name: "jump-arrived",
          detail: `target=(${this.toPage(n).toFixed(1)},${this.toPage(o).toFixed(1)})`,
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.popActionStack();
        return;
      }
      this.x += b * A / v, this.y += b * g / v, this.guardStall(t);
      return;
    }
    const s = !!i && (i.velocity.x !== 0 || i.velocity.y !== 0);
    if (!!i && (e.type === "Move" || e.type === "Animate" || s)) {
      const A = this.x, g = this.y;
      if (n !== null && (i.velocity.x > 0 ? this.lookRight = n < this.x : i.velocity.x < 0 && (this.lookRight = n > this.x)), o !== null && (this.borderIsOn("left", { x: this.x, y: this.y }) && (this.lookRight = !1), this.borderIsOn("right", { x: this.x, y: this.y }) && (this.lookRight = !0)), this.x += (this.lookRight ? -1 : 1) * i.velocity.x, this.y += i.velocity.y, n !== null && (A <= n && this.x >= n || A >= n && this.x <= n)) {
        this.x = n, this.emit({
          kind: "milestone",
          name: "target-x",
          detail: `TargetX=${this.toPage(n).toFixed(1)}`,
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.popActionStack();
        return;
      }
      if (o !== null && (g <= o && this.y >= o || g >= o && this.y <= o)) {
        this.y = o, this.emit({
          kind: "milestone",
          name: "target-y",
          detail: `TargetY=${this.toPage(o).toFixed(1)}`,
          x: this.x,
          y: this.y,
          leaf: this.leafLabel()
        }), this.popActionStack();
        return;
      }
      const v = this.area();
      if (e.borderType === "Floor" && (this.x < A && this.x <= v.left || this.x > A && this.x >= v.right)) {
        if (this.constrainToWorkArea(), this.actionStack.slice(0, -1).some(
          (p) => {
            var I;
            return p.node.type === "Sequence" && p.childIndex < (((I = p.node.children) == null ? void 0 : I.length) ?? 0);
          }
        )) {
          this.vx = this.vy = 0, this.popActionStack(), this.advanceActionTree();
          return;
        }
        this.lookRight = this.x === v.right, this.vx = this.vy = 0, this.setBehavior("ClimbAlongWall", "floor-wall-contact"), this.advanceActionTree();
        return;
      }
    }
    const c = this.currentLeaf();
    (c == null ? void 0 : c.borderType) === "Wall" && (this.borderIsOn("left", { x: this.x, y: this.y }) && (this.lookRight = !1), this.borderIsOn("right", { x: this.x, y: this.y }) && (this.lookRight = !0)), (n !== null || o !== null || s || e.type === "Move") && this.guardStall(t);
  }
  /** Closed sides/bottom; only the ordinary Fall behavior may leave through the top.
   * Thrown and jump behaviors can contain a Falling leaf too, so the leaf alone
   * must never grant the top exception. Contact does not change the action. */
  constrainToWorkArea() {
    var t;
    const e = this.area();
    this.x < e.left ? (this.x = e.left, this.vx < 0 && (this.vx = 0)) : this.x > e.right && (this.x = e.right, this.vx > 0 && (this.vx = 0)), this.y > e.bottom ? (this.y = e.bottom, this.vy > 0 && (this.vy = 0)) : this.y < e.top && (this.isDragging || ((t = this.currentBehavior) == null ? void 0 : t.name) !== "Fall") && (this.y = e.top, this.vy < 0 && (this.vy = 0));
  }
  /** Grab only when motion enters a wall/ceiling, before any floor impact.
   * Sliding vertically after scroll detachment has no horizontal impact. */
  grabImpactSurface(e, t) {
    var c;
    const i = this.area(), n = this.x - e, o = this.y - t;
    let s = o > 0 && t < i.bottom && this.y >= i.bottom ? (i.bottom - t) / o : 1 / 0, a = null;
    for (const [u, h] of [
      ["left-wall", i.left],
      ["right-wall", i.right]
    ]) {
      if (u === "left-wall" ? n >= 0 || e < h || this.x > h : n <= 0 || e > h || this.x < h)
        continue;
      const l = (h - e) / n, d = t + o * l;
      l < s && d >= i.top && d < i.bottom && (s = l, a = u);
    }
    if (((c = this.currentBehavior) == null ? void 0 : c.name) !== "Fall" && o < 0 && t >= i.top && this.y <= i.top) {
      const u = (i.top - t) / o, h = e + n * u;
      u < s && h >= i.left && h <= i.right && (s = u, a = "ceiling");
    }
    return a ? (this.x = e + n * s, this.y = t + o * s, a === "ceiling" ? this.y = i.top : this.x = a === "left-wall" ? i.left : i.right, this.vx = this.vy = 0, this.lookRight = a === "right-wall", this.lastSurface = a, this.setBehavior(
      a === "ceiling" ? "HoldOntoCeiling" : "HoldOntoWall",
      "airborne-border-contact"
    ), this.advanceActionTree(), !0) : !1;
  }
  /** Intersect this downward movement with the floor, including side collisions. */
  landOnFloor(e, t) {
    const i = this.area();
    if (this.y <= t || t >= i.bottom || this.y < i.bottom)
      return !1;
    const n = (i.bottom - t) / (this.y - t), o = Math.max(
      i.left,
      Math.min(i.right, e + (this.x - e) * n)
    );
    return this.x = o, this.y = i.bottom, this.vx = this.vy = 0, this.isScrollStartContact() ? (this.prevY = this.y, !1) : (this.protectScrollLanding(), this.emit({
      kind: "milestone",
      name: "land",
      detail: "downward floor crossing",
      x: this.x,
      y: this.y,
      leaf: this.leafLabel()
    }), !0);
  }
  /** Finish this flight without replacing the pack's remaining landing sequence. */
  finishFloorLanding() {
    var t;
    this.scrollFallRoot === this.actionStack[0] && this.graceAfterScrollLanding(), this.settleAfterLanding();
    const e = this.actionStack[0];
    do
      this.isFallLike(this.currentLeaf()) && (this.vx = this.vy = 0, this.popActionStack()), this.advanceActionTree();
    while (this.actionStack[0] === e && this.actionExpansionsThisTick < ve && (this.isFallLike(this.currentLeaf()) && this.y === this.area().bottom && this.vy >= 0 || ["Sequence", "Select", "ActionReference"].includes(((t = this.currentLeaf()) == null ? void 0 : t.type) ?? "")));
  }
  onBehaviorEnd(e = "behavior-end") {
    var A, g, v, b;
    if (!this.config) return;
    const t = f.animationConfig, i = e === "behavior-end" ? this.behaviorSwitchReason() : null;
    i && (this.wantMovement = i === "forced-switch", this.observeScheduledSwitch(i));
    const n = this.mascotName, o = [], s = ((A = this.currentBehavior) == null ? void 0 : A.nextBehaviors) || [], a = i !== null || t.exitsToPool(n, (g = this.currentBehavior) == null ? void 0 : g.name);
    for (const p of a ? [] : s) {
      if (!this.evaluateCondition(p.condition) || !t.allows(n, p.name)) continue;
      const I = this.config.behaviors.find(
        (x) => x.name === p.name
      );
      if (I && !this.behaviorUsable(I)) continue;
      const k = this.effectiveWeight(
        p.name,
        p.frequency
      );
      k <= 0 || o.push({ ...p, frequency: k });
    }
    if (!o.length || ((v = this.currentBehavior) == null ? void 0 : v.addNext) !== !1)
      for (const p of this.config.behaviors) {
        const I = t.weightOverride(n, p.name);
        if ((I !== void 0 ? I <= 0 : p.frequency <= 0) || !t.allows(n, p.name) || !this.evaluateCondition(p.condition) || !this.behaviorUsable(p))
          continue;
        const k = this.effectiveWeight(
          p.name,
          p.frequency
        );
        k <= 0 || o.push({ name: p.name, id: p.id, frequency: k });
      }
    if (!o.length) {
      const p = this.config.behaviors.find((I) => I.name === "StandUp") ?? this.config.behaviors[0];
      p && this.setBehavior(p.name, "no-candidates");
      return;
    }
    let c = o;
    if (this.wantMovement) {
      this.wantMovement = !1;
      const p = o.filter(
        (I) => this.canTravel(I.name)
      );
      p.length > 0 && (c = p);
    }
    const u = this.currentBorderAt(void 0);
    if (u) {
      const p = c.filter((I) => {
        const k = this.firstBorderOf(I.name);
        return k === null || k === re || k === u;
      });
      p.length > 0 && (c = p);
    }
    const h = t.optionsFor(n).repeatBehaviorWeight ?? 1, l = c.filter((p) => this.hasReachableInteractionOpportunity(p.name));
    l.length && (c = l), h < 1 && (a || ((b = this.currentBehavior) == null ? void 0 : b.addNext) !== !1) && c.some((p) => {
      var I;
      return p.name !== ((I = this.currentBehavior) == null ? void 0 : I.name);
    }) && (c = c.map((p) => {
      var I;
      return p.name === ((I = this.currentBehavior) == null ? void 0 : I.name) ? { ...p, frequency: p.frequency * h } : p;
    }));
    const d = c.reduce(
      (p, I) => p + Math.max(0, I.frequency),
      0
    );
    if (d <= 0) {
      this.setBehavior(c[0].name, e, c[0].id, i ?? void 0);
      return;
    }
    let y = Math.random() * d;
    for (const p of c)
      if (y -= p.frequency, y <= 0) {
        this.setBehavior(p.name, e, p.id, i ?? void 0);
        return;
      }
    this.setBehavior(c[0].name, e, c[0].id, i ?? void 0);
  }
  render(e = !0) {
    const t = this.currentPose();
    if (!t) return;
    const i = e ? Math.max(0, Math.min(1, this.accumulator / T.tickMs)) : 1, n = this.prevX + (this.x - this.prevX) * i, o = this.prevY + (this.y - this.prevY) * i;
    this.lastRenderedX = n, this.lastRenderedY = o;
    const s = this.spriteScale;
    if (this.elRoot.style.transform = `translate3d(${n * s}px, ${o * s}px, 0)`, !t.image) {
      this.interactionVisualActive && (this.elImg.style.visibility = "hidden", this.elImg.removeAttribute("src"));
      return;
    }
    this.lastRenderedPose = t;
    const a = this.spriteUrl(t.image);
    this.elImg.getAttribute("src") !== a && (this.elImg.src = a), this.elImg.complete && this.elImg.naturalWidth > 0 && (this.elImg.style.visibility = "visible"), this.elImg.naturalWidth > 0 && this.applySpriteIntrinsicSize();
    let c = 1, u = 1;
    this.scrollSquashEnabled && this.squashAmount > 0 && (u = 1 - 0.2 * this.squashAmount, c = 1 + 0.1 * this.squashAmount, this.squashAmount *= 0.85, this.squashAmount < 5e-3 && (this.squashAmount = 0));
    const h = t.imageAnchor.x, l = t.imageAnchor.y, d = this.lookRight ? -1 : 1;
    this.elImg.style.transform = `translate(${-d * h * s * c}px, ${-l * s * u}px) scaleX(${d * s * c}) scaleY(${s * u})`, this.elImg.style.transformOrigin = "0 0";
  }
};
/** Every live mascot, so `mascot.totalCount` means something to the packs. */
m(f, "liveEngines", /* @__PURE__ */ new Set()), /** Sprite URLs already fetched, shared by every mascot of the same pack. */
m(f, "preloaded", /* @__PURE__ */ new Set()), /** Observation points; the log recorder subscribes instead of polling. */
m(f, "observers", /* @__PURE__ */ new Set()), m(f, "nextId", 1), /** Animation customisation, shared by every mascot (see AnimationConfig). */
m(f, "animationConfig", new ge()), m(f, "animationConfigLoad", null), m(f, "animationConfigSetExplicitly", !1), /**
 * Host-level answer to "should the built-in preset apply?", set through
 * `configure({ ignoreBuiltin })`. `null` means "whatever the file says", which
 * `AnimationConfig` tracks on its own.
 */
m(f, "builtinPreference", null), /** Affordance registry, shared by every mascot in the page (broadcast/manager). */
m(f, "broadcasts", new Me()), m(f, "globalEventsInstalled", !1), m(f, "extensionMode", !1), m(f, "externalScroll", !1), /** Removes the reduced-motion listener again; null while none is installed. */
m(f, "reducedMotionWatcher", null), /** Default location of the editable configuration file. */
m(f, "ANIMATION_CONFIG_URL", "/animation.config.json"), /** Default base URL of the mascot packs. A hosted or embedded build overrides
 *  this so sprites never resolve against the host page's root path. */
m(f, "PACK_BASE_URL", "/mascot_pack"), /** Decided on the first load; `reloadAnimationConfig(url)` re-decides it. */
m(f, "animationConfigUrl", null), /** Overridden by the host so a pack can live anywhere; see `configure()`. */
m(f, "packBaseUrl", f.PACK_BASE_URL);
let ft = f;
export {
  ge as A,
  Me as B,
  jt as C,
  dt as L,
  ft as M,
  se as P,
  pn as S,
  gn as a,
  dn as b,
  un as c,
  fn as d,
  $e as e,
  mn as f,
  ki as l,
  Xe as n,
  he as t
};
//# sourceMappingURL=MascotEngine-ZpR16gBw.js.map
