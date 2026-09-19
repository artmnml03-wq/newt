import { gsap, ranges, clamp, rem, cssPx } from "./stages.js";

const SPEED = 1.25; // px the row moves per px of page scroll
const FADE_MIN = 0.2; // opacity of a card that has just entered from the right

// The row of covers enters from the right edge and travels left while the
// section is held. Covers fade in from 20% as they slide in. The row can also
// be dragged with the mouse (or a finger, or a horizontal trackpad swipe): the
// drag simply moves the page scroll, so scroll and drag always stay in sync.
// The previous section is dimmed to 20% while this one slides over it.
export function initAlbums(stage, prevStage) {
  const panel = stage.panel;
  const row = panel.querySelector(".cards");
  const cards = gsap.utils.toArray(row.children);
  const rowLeft = () => parseFloat(getComputedStyle(row).left);

  // Width of the layout viewport (without a classic scrollbar).
  const vw = () => document.documentElement.clientWidth;

  // Sizes come from the laid-out cards, so they follow the scale of the page.
  const cardW = () => cards[0].offsetWidth;
  const gap = () => parseFloat(getComputedStyle(row).columnGap) || 0;
  const rowWidth = () => cards.length * cardW() + (cards.length - 1) * gap();
  const edge = () => cssPx("--edge", panel); // gap between the last card and the right screen edge

  // Row offsets: fully off-screen right → last card at the right edge.
  const xStart = () => vw() - rowLeft();
  const xEnd = () => vw() - edge() - rowLeft() - rowWidth();
  const travel = () => xStart() - xEnd();
  stage.dwell = () => travel() / SPEED;

  const update = (progress) => {
    const x = xStart() - progress * travel();
    // Cards left of the reveal line are fully visible; the line sweeps to the
    // right edge so the last cards are at 100% when the row comes to rest.
    const reveal = vw() * (0.5 + 0.5 * progress);
    const span = rem(500); // distance over which a card goes from FADE_MIN to 100%
    cards.forEach((card, i) => {
      const left = rowLeft() + i * (cardW() + gap()) + x;
      const t = clamp((left - reveal) / span);
      gsap.set(card, { opacity: 1 - (1 - FADE_MIN) * t });
    });
  };
  update(0);

  const trigger = gsap.fromTo(
    row,
    { x: () => xStart() },
    {
      x: () => xEnd(),
      ease: "none",
      scrollTrigger: {
        ...ranges.dwell(stage),
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => update(self.progress),
        onRefresh: (self) => update(self.progress),
      },
    },
  ).scrollTrigger;

  initDrag(panel, trigger);

  if (prevStage) {
    gsap.to(prevStage.panel.children, {
      opacity: 0.2,
      ease: "none",
      scrollTrigger: { ...ranges.enter(stage), scrub: true },
    });
  }
}

function initDrag(panel, trigger) {
  const inRange = () => window.scrollY >= trigger.start - 2 && window.scrollY <= trigger.end + 2;
  const toScroll = (v) => clamp(v, trigger.start, trigger.end);

  let drag = null; // { x, scroll, moved, samples }
  let glide = null;

  const stopGlide = () => {
    glide?.kill();
    glide = null;
  };

  panel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !inRange()) return;
    stopGlide();
    drag = { id: event.pointerId, x: event.clientX, scroll: window.scrollY, moved: false, samples: [] };
  });

  panel.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 4) return;
      drag.moved = true;
      panel.setPointerCapture(event.pointerId);
      panel.classList.add("is-dragging");
    }
    const now = performance.now();
    drag.samples.push({ t: now, x: event.clientX });
    while (drag.samples.length > 1 && now - drag.samples[0].t > 100) drag.samples.shift();
    // Dragging right moves the cards right, i.e. scrolls back up.
    window.scrollTo(0, toScroll(drag.scroll - dx / SPEED));
  });

  const end = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { moved, samples } = drag;
    drag = null;
    panel.classList.remove("is-dragging");
    if (!moved) return;

    // Let go with a little momentum.
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last && first ? last.t - first.t : 0;
    const velocity = dt > 10 ? (last.x - first.x) / dt : 0; // px per ms
    const from = window.scrollY;
    const to = toScroll(from - (velocity * 300) / SPEED);
    if (Math.abs(to - from) < 2) return;
    const state = { v: 0 };
    glide = gsap.to(state, {
      v: 1,
      duration: 0.9,
      ease: "power3.out",
      onUpdate: () => window.scrollTo(0, from + (to - from) * state.v),
    });
  };
  panel.addEventListener("pointerup", end);
  panel.addEventListener("pointercancel", end);

  // Horizontal trackpad swipes move the row as well.
  panel.addEventListener(
    "wheel",
    (event) => {
      stopGlide();
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || !inRange()) return;
      event.preventDefault();
      window.scrollTo(0, toScroll(window.scrollY + event.deltaX / SPEED));
    },
    { passive: false },
  );

  // A drag must not start a native image drag or select text.
  panel.addEventListener("dragstart", (event) => event.preventDefault());
}
