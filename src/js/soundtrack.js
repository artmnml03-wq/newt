import { gsap, ScrollTrigger, ranges, viewH, clamp } from "./stages.js";

// Palette the section walks through while it is scrolled: [background, text].
const PALETTE = [
  ["#fcfcfa", "#121212"], // white
  ["#c1c1bd", "#121212"], // gray
  ["#808080", "#fcfcfa"], // graphite
];

// Scroll spent with the headline fully in view before the content starts to
// slide up (in screens).
const PRE_HOLD = 0.35;

// While the section slides over the hero the headline letters travel from a
// tight word to their full-width positions. Once it covers the screen it stays
// put, then its content slides up under the ticker while the background and
// text colours change with the scroll.
export function initSoundtrack(stage) {
  const panel = stage.panel;
  const inner = panel.querySelector(".s2__inner");
  const rows = gsap.utils.toArray(panel.querySelectorAll(".sd-row"));

  const slide = () => Math.max(0, inner.offsetHeight - viewH());
  const pre = () => window.innerHeight * PRE_HOLD;
  stage.dwell = () => pre() + slide();

  // Offset that packs the items of a row back together at its left edge.
  const packedOffsets = (row) => () => {
    const items = [...row.children];
    const rowLeft = row.getBoundingClientRect().left;
    let cursor = rowLeft;
    return items.map((el) => {
      const { left, width } = el.getBoundingClientRect();
      const natural = left - (gsap.getProperty(el, "x") || 0);
      const offset = cursor - natural;
      cursor += width;
      return offset;
    });
  };

  rows.forEach((row) => {
    const offsets = packedOffsets(row);
    gsap.fromTo(
      row.children,
      { x: (i) => offsets()[i], opacity: 0.2 },
      {
        x: 0,
        opacity: 1,
        ease: "none",
        stagger: { each: 0.04, from: "start" },
        scrollTrigger: { ...ranges.enter(stage), scrub: 0.5, invalidateOnRefresh: true },
      },
    );
  });

  // Held phase, computed straight from the scroll progress so it stays correct
  // when the window is resized: [pre-hold][content slides up + colours change].
  const apply = ({ progress }) => {
    const total = stage.dwellPx || 1;
    const t = slide() ? clamp((progress * total - pre()) / slide()) : 0;
    gsap.set(inner, { y: -t * slide() });

    const pos = clamp(progress) * (PALETTE.length - 1);
    const i = Math.min(Math.floor(pos), PALETTE.length - 2);
    const f = pos - i;
    panel.style.backgroundColor = gsap.utils.interpolate(PALETTE[i][0], PALETTE[i + 1][0], f);
    panel.style.color = gsap.utils.interpolate(PALETTE[i][1], PALETTE[i + 1][1], f);
  };

  ScrollTrigger.create({
    ...ranges.dwell(stage),
    onUpdate: apply,
    onRefresh: apply,
  });
}
