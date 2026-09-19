import "./main.css";
import { initTicker } from "./js/ticker.js";
import { registerStage, initStages, ScrollTrigger } from "./js/stages.js";
import { initHero } from "./js/hero.js";
import { initSoundtrack } from "./js/soundtrack.js";
import { initAlbums } from "./js/albums.js";
import { initVideo } from "./js/video.js";
import { initWeek } from "./js/week.js";
import { initSubscribe } from "./js/subscribe.js";
import { initPopup } from "./js/popup.js";
import { initCursor } from "./js/cursor.js";
import { initPlayers } from "./js/player.js";
import { initMenu } from "./js/menu.js";
import { initNav, jumpToHash } from "./js/nav.js";

initTicker();
initCursor();
initMenu();
initNav();

// After a section has finished its animation it stays on screen for a moment
// (in screens of scroll) before the next one starts to slide over it.
const screens = (n) => () => window.innerHeight * n;

// Order matters: each stage slides over the previous one.
const hero = registerStage("stage-hero", { dwell: screens(2), hold: screens(0.6) });
const soundtrack = registerStage("stage-soundtrack", { hold: screens(0.5) });
const albums = registerStage("stage-albums", { hold: screens(0.4), land: 0.2 });
const video = registerStage("stage-video", { hold: screens(0.3), land: 0.15 });
const week = registerStage("stage-week", { hold: screens(0.4), land: 0.5 });
const subscribe = registerStage("stage-subscribe", { cover: false });

// Sections that need to measure themselves set their own dwell before layout.
initAlbums(albums, soundtrack);
initSoundtrack(soundtrack);
initVideo(video);
initWeek(week);
initSubscribe(subscribe);

initStages();

initHero(hero);
initPlayers();

// Wait for fonts and images so measurements are right.
const ready = () => ScrollTrigger.refresh();
ready();
document.fonts?.ready.then(ready);
window.addEventListener("load", () => {
  ready();
  jumpToHash();
});

initPopup();
