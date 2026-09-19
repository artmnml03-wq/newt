import { gsap, ranges, cssPx } from "./stages.js";

// The inline covers grow from zero width inside the headline (pushing the
// words apart) while the words come in from 30% to 100% opacity.
export function initWeek(stage) {
  const words = gsap.utils.toArray(stage.panel.querySelectorAll(".wk-word"));
  const figs = gsap.utils.toArray(stage.panel.querySelectorAll(".wk-fig"));
  const captions = figs.map((f) => f.querySelector("figcaption"));
  const clips = figs.map((f) => f.querySelector(".wk-clip"));

  stage.dwell = () => window.innerHeight * 1.2;

  // Row order: word, fig, word, fig / word, fig, word, fig
  const order = [words[0], figs[0], words[1], figs[1], words[2], figs[2], words[3], figs[3]];

  gsap.set(words, { opacity: 0.3 });
  gsap.set(figs, { width: 0, marginRight: 0 });
  gsap.set(clips, { width: 0 });
  gsap.set(captions, { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { ...ranges.dwell(stage), scrub: 0.5, invalidateOnRefresh: true },
  });

  const step = 1;
  let t = 0;
  order.forEach((el) => {
    if (el.classList.contains("wk-word")) {
      tl.to(el, { opacity: 1, duration: step * 0.5 }, t);
      t += step * 0.5;
    } else {
      const i = figs.indexOf(el);
      tl.to(el, { width: () => cssPx("--wk-fig-w", stage.panel), marginRight: () => cssPx("--wk-gap", stage.panel), duration: step }, t);
      tl.to(clips[i], { width: () => cssPx("--wk-fig-w", stage.panel), duration: step }, t);
      tl.to(captions[i], { opacity: 1, duration: step * 0.4 }, t + step * 0.6);
      t += step;
    }
  });
}
