const POINTS = 5; // links in the chain that follows the pointer
const STIFFNESS = 0.3;
const DAMPING = 0.5;
const WIDTH = 3;
const IDLE_MS = 120; // the line disappears this long after the pointer stops
const FADE_MS = 220;

// A short, slightly shaky red line that follows the pointer while it moves
// (like the cursor on blimp.gr). Each link chases the previous one with a
// spring, so the line stretches and curls as the pointer changes direction.
export function initCursor() {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced) return;

  const canvas = document.createElement("canvas");
  canvas.className = "cursor-trail";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const color = getComputedStyle(document.documentElement).getPropertyValue("--red").trim() || "#e71d1d";
  const mouse = { x: 0, y: 0 };
  const chain = Array.from({ length: POINTS }, () => ({ x: 0, y: 0, dx: 0, dy: 0 }));
  let width = 0;
  let height = 0;
  let raf = 0;
  let lastMove = 0;
  let seeded = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
  };

  const jitter = (amount) => (Math.random() - 0.5) * amount;

  const step = () => {
    chain.forEach((p, i) => {
      const target = i === 0 ? mouse : chain[i - 1];
      p.dx += STIFFNESS * (target.x - p.x) + jitter(2);
      p.dy += STIFFNESS * (target.y - p.y) + jitter(2);
      p.dx *= DAMPING;
      p.dy *= DAMPING;
      p.x += p.dx;
      p.y += p.dy;
    });
  };

  const draw = (alpha) => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(chain[0].x + jitter(2), chain[0].y + jitter(2));
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      ctx.quadraticCurveTo(a.x + jitter(50), a.y + jitter(50), (a.x + b.x) / 2 + jitter(2), (a.y + b.y) / 2 + jitter(2));
    }
    const tail = chain[chain.length - 1];
    ctx.lineTo(tail.x, tail.y);
    ctx.stroke();
  };

  const frame = (now) => {
    const idle = now - lastMove;
    if (idle > IDLE_MS + FADE_MS) {
      ctx.clearRect(0, 0, width, height);
      raf = 0;
      return;
    }
    step();
    draw(idle <= IDLE_MS ? 1 : 1 - (idle - IDLE_MS) / FADE_MS);
    raf = requestAnimationFrame(frame);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!seeded) {
        // Start folded up at the pointer instead of flying in from a corner.
        chain.forEach((p) => Object.assign(p, { x: mouse.x, y: mouse.y, dx: 0, dy: 0 }));
        seeded = true;
      }
      lastMove = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
  // Re-seed after the pointer has left the window so the line does not streak.
  document.documentElement.addEventListener("pointerleave", () => (seeded = false));

  window.addEventListener("resize", resize);
  resize();
}
