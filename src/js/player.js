import { ScrollTrigger, ranges } from "./stages.js";

// Every `.player[data-src]` card plays the audio file named in `data-src`.
// To add music: put the file in public/audio/ and point data-src at it, e.g.
//   <div class="player" data-src="/audio/my-track.m4a"> …
// Only one track plays at a time. A track pauses when its card slides out of
// view, or when the next section has mostly covered the hero.

// Paths like "/audio/x.m4a" are relative to the site root; when the site is served
// from a sub-folder (GitHub Pages) the base path has to be put in front of them.
const withBase = (path) => (path.startsWith("/") ? import.meta.env.BASE_URL + path.slice(1) : path);

const pad = (n) => String(n).padStart(2, "0");
const fmt = (sec) => {
  const s = Math.max(0, Math.round(sec) || 0);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

const items = [];

function pauseAll(except) {
  items.forEach((item) => item !== except && item.audio.pause());
}

function setup(el) {
  const audio = new Audio();
  audio.preload = "metadata";
  audio.src = withBase(el.dataset.src);

  const button = el.querySelector(".player__play");
  const time = el.querySelector(".player__time");
  const artist = el.querySelector(".player__artist")?.textContent.trim() ?? "";
  const title = el.querySelector(".player__title")?.textContent.trim() ?? "";
  const thumb = el.querySelector(".player__thumb")?.getAttribute("src");

  const item = { el, audio };
  let started = false; // the time shows the total length until the first play

  const showTotal = () => {
    if (Number.isFinite(audio.duration)) time.textContent = fmt(audio.duration);
  };
  const setPlaying = (playing) => {
    el.classList.toggle("is-playing", playing);
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"}: ${artist} – ${title}`);
  };

  audio.addEventListener("loadedmetadata", () => {
    if (!started) showTotal();
  });
  audio.addEventListener("timeupdate", () => {
    if (started) time.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener("play", () => {
    started = true;
    pauseAll(item);
    setPlaying(true);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        artwork: thumb ? [{ src: thumb, sizes: "72x44", type: "image/png" }] : [],
      });
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    }
  });
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    started = false;
    showTotal();
    setPlaying(false);
  });
  audio.addEventListener("error", () => {
    el.classList.add("is-unavailable");
    button.setAttribute("aria-disabled", "true");
    button.title = "Audio is not available";
  });

  button.addEventListener("click", () => {
    if (el.classList.contains("is-unavailable")) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  items.push(item);
  return item;
}

export function initPlayers() {
  const players = [...document.querySelectorAll(".player[data-src]")];
  if (!players.length) return;
  players.forEach(setup);

  // Pause a track when its card has (mostly) slid out of the screen.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio < 0.3) items.find((i) => i.el === entry.target)?.audio.pause();
      });
    },
    { threshold: [0, 0.3, 1] },
  );
  players.forEach((el) => observer.observe(el));

  // The next section covers a player without moving its card, so visibility
  // alone cannot tell: pause the section's tracks once the cover is well under way.
  new Set(players.map((el) => el.closest(".stage"))).forEach((stageEl) => {
    const next = stageEl?.nextElementSibling;
    if (!next) return;
    ScrollTrigger.create({
      ...ranges.enter({ el: next }),
      onUpdate: (self) => {
        if (self.progress > 0.4) items.filter((i) => stageEl.contains(i.el)).forEach((i) => i.audio.pause());
      },
    });
  });
}
