import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** Current root font size in px (the layout scales with the window). */
export const rootPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/** Converts a size measured on the 1440×800 mockup (px) to the current scale. */
export const rem = (designPx) => (designPx / 16) * rootPx();

/** True in the tablet / mobile layouts (the ticker is replaced by a top bar). */
export const isCompact = () => window.matchMedia("(max-width: 1023px)").matches;

/**
 * Height of the fixed chrome at the top of the screen: the ticker on desktop,
 * the menu bar on tablet and mobile. Sections stick right below it.
 */
export const tickerH = () => document.querySelector(isCompact() ? ".menu" : ".ticker")?.offsetHeight ?? 0;

/** Resolves a CSS length held in a custom property (rem, px, %, …) to px. */
export function cssPx(name, host = document.documentElement) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:0;width:var(${name})`;
  host.append(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
}

/** Height of one screen under the ticker. */
export const viewH = () => window.innerHeight - tickerH();

const stages = [];

/**
 * Registers a section.
 *
 * Every stage is a tall wrapper holding one sticky panel:
 *   wrapper height = panel
 *                  + dwell  (scroll during which the panel is animated)
 *                  + hold   (scroll during which the finished panel just stays)
 *                  + one screen if the next stage should slide over it.
 * The next stage gets a negative top margin of one screen, so it starts rising
 * exactly when dwell + hold are over and fully covers the panel by the time the
 * wrapper ends.
 *
 * @param {string} id      wrapper element id
 * @param {object} opts
 * @param {() => number} [opts.dwell]  scroll (px) used by the section's animation
 * @param {() => number} [opts.hold]   extra scroll (px) to keep the finished section on screen
 * @param {boolean} [opts.cover]       next stage slides over this one
 * @param {number} [opts.land]         how far into its animation (0 – 1) the menu links land
 */
export function registerStage(id, { dwell = () => 0, hold = () => 0, cover = true, land = 0 } = {}) {
  const el = document.getElementById(id);
  const stage = { el, panel: el.firstElementChild, dwell, hold, cover, land };
  stages.push(stage);
  return stage;
}

export const getStage = (id) => stages.find((s) => s.el.id === id);

/**
 * Page scroll position at which a section is "arrived": it has fully covered
 * the previous one and its animation has advanced by `land` (0 – 1).
 */
export function scrollPosOf(stage) {
  const docTop = stage.el.getBoundingClientRect().top + window.scrollY;
  return Math.round(docTop - tickerH() + stage.land * (stage.dwellPx || 0));
}

export function layoutStages() {
  const top = tickerH();
  const view = window.innerHeight - top;
  stages.forEach((s, i) => {
    s.el.style.height = "";
    s.el.style.marginTop = "";
    s.el.style.zIndex = String(i + 1);
    s.panel.style.position = "sticky";
    s.panel.style.top = `${top}px`;
    s.h = s.panel.offsetHeight;
    s.dwellPx = Math.max(0, Math.round(s.dwell()));
    s.holdPx = Math.max(0, Math.round(s.hold()));
    s.el.style.height = `${s.h + s.dwellPx + s.holdPx + (s.cover && stages[i + 1] ? view : 0)}px`;
    if (i > 0 && stages[i - 1].cover) s.el.style.marginTop = `${-view}px`;
  });
}

/** ScrollTrigger positions (relative to the stage wrapper). */
export const ranges = {
  /** The stage is rising over the previous one. */
  enter: (s) => ({
    trigger: s.el,
    start: "top bottom",
    end: () => `top top+=${tickerH()}`,
  }),
  /** The panel is held in place while its animation plays. */
  dwell: (s) => ({
    trigger: s.el,
    start: () => `top ${tickerH()}px`,
    end: () => `+=${s.dwellPx}`,
  }),
};

export function initStages() {
  layoutStages();
  ScrollTrigger.addEventListener("refreshInit", layoutStages);
}

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
