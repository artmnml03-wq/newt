import { gsap, ranges } from "./stages.js";

// Three screens slide horizontally while the ticker, menu and rail stay put.
// Content is at 40% opacity while it is off-centre and reaches 100% when it
// has fully arrived.
export function initHero(stage) {
  const screens = gsap.utils.toArray(stage.panel.querySelectorAll(".screen"));

  screens.forEach((el, i) => gsap.set(el, { xPercent: i * 100, opacity: i === 0 ? 1 : 0.4 }));

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { ...ranges.dwell(stage), scrub: 0.4 },
  });

  tl.to(screens, { xPercent: "-=200", duration: 2 }, 0);
  tl.to(screens[0], { opacity: 0.4, duration: 1 }, 0);
  tl.fromTo(screens[1], { opacity: 0.4 }, { opacity: 1, duration: 1 }, 0);
  tl.to(screens[1], { opacity: 0.4, duration: 1 }, 1);
  tl.fromTo(screens[2], { opacity: 0.4 }, { opacity: 1, duration: 1 }, 1);
}
