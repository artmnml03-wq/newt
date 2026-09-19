import { gsap, ScrollTrigger, ranges, viewH, rem } from "./stages.js";

// Splits an element's text into word spans (keeps <br> and spaces).
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", words.join(" "));
  el.textContent = "";
  return words.map((word, i) => {
    const span = document.createElement("span");
    span.className = "w";
    span.setAttribute("aria-hidden", "true");
    span.textContent = word;
    el.append(span);
    if (i < words.length - 1) el.append(" ");
    return span;
  });
}

// The video stays fixed. The text scrolls up over it and its words appear
// from 30% to 100% opacity.
export function initVideo(stage) {
  const text = stage.panel.querySelector(".s4__text");
  const words = [...text.querySelectorAll("[data-split]")].flatMap(splitWords);
  const video = stage.panel.querySelector("video");

  stage.dwell = () => window.innerHeight * 1.2;

  gsap.set(words, { opacity: 0.3 });

  const overflow = () => Math.max(0, text.offsetTop + text.offsetHeight - (viewH() - rem(60)));

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { ...ranges.dwell(stage), scrub: 0.5, invalidateOnRefresh: true },
  });
  tl.to(text, { y: () => -overflow(), duration: 1 }, 0);
  tl.to(words, { opacity: 1, stagger: { each: 0.05 }, duration: 0.12 }, 0);

  // The background loops silently while the section is on screen and is paused
  // otherwise. With reduced motion the poster frame stays.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (video && !reduced && video.querySelector("source, [src]")) {
    ScrollTrigger.create({
      trigger: stage.el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? video.play().catch(() => {}) : video.pause()),
    });
  }
}
