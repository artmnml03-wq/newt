import { gsap, getStage, scrollPosOf } from "./stages.js";

// The five menu items lead to the sections in order; the logo leads to the top.
//   [ARCHIVE] → 2 Soundtrack for the day    [GENRES]   → 3 Previous albums
//   [ARTISTS] → 4 Video                     [LABELS]   → 5 Albums of the week
//   [CONTACTS] → 6 Subscribe                (logo) → 1 Hero
const TARGETS = {
  "": "stage-hero",
  "#archive": "stage-soundtrack",
  "#genres": "stage-albums",
  "#artists": "stage-video",
  "#labels": "stage-week",
  "#contacts": "stage-subscribe",
};

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let tween = null;
const stop = () => {
  tween?.kill();
  tween = null;
};

function goTo(stageId, { instant = false } = {}) {
  const stage = getStage(stageId);
  if (!stage) return;
  stop();
  const to = scrollPosOf(stage);
  const from = window.scrollY;
  const distance = Math.abs(to - from);
  if (instant || reduced() || distance < 2) {
    window.scrollTo(0, to);
    return;
  }
  // Long trips take a little longer, but never more than ~2.4 s.
  const duration = Math.min(2.4, 0.9 + distance / 7000);
  const state = { y: from };
  tween = gsap.to(state, {
    y: to,
    duration,
    ease: "power2.inOut",
    onUpdate: () => window.scrollTo(0, state.y),
    onComplete: () => (tween = null),
  });
}

/** Stage id for a link that points at one of the sections, otherwise null. */
function targetOf(link) {
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return null;
  return url.hash in TARGETS ? TARGETS[url.hash] : null;
}

export function initNav() {
  // Anything the user does to scroll takes over from the animated jump.
  ["wheel", "touchstart", "keydown"].forEach((type) => window.addEventListener(type, stop, { passive: true }));

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const id = targetOf(link);
    if (!id) return;
    event.preventDefault();
    goTo(id);
    const hash = new URL(link.href, window.location.href).hash;
    history.replaceState(null, "", hash || window.location.pathname);
  });

  // Back / forward and links typed with a hash.
  window.addEventListener("hashchange", () => {
    const id = TARGETS[window.location.hash];
    if (id) goTo(id);
  });
}

/** Opens the page already scrolled to the section named in the URL (e.g. /#genres). */
export function jumpToHash() {
  const id = TARGETS[window.location.hash];
  if (id && window.location.hash) goTo(id, { instant: true });
}
