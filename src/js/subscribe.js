import { gsap, ranges } from "./stages.js";

// Set to the URL of your form backend. While it is null, submitting succeeds
// locally so the success state can be reviewed.
const FORM_ENDPOINT = null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// As the section arrives, its elements come in from 30% to 100% opacity, the
// balloon grows out of the top-right corner (from 0.6× to full size, also from
// 30% opacity) and the Subscribe button turns red. (Animation reference: 3 frames.)
export function initSubscribe(stage) {
  const panel = stage.panel;
  const fades = gsap.utils.toArray(panel.querySelectorAll("[data-fade]"));
  const zoom = panel.querySelector(".s6__zoom");

  stage.dwell = () => window.innerHeight * 0.3;

  gsap.set(fades, { opacity: 0.3 });
  gsap.set(zoom, { scale: 0.6, opacity: 0.3 });
  gsap.set(panel, { "--btn-bg": "rgb(18, 18, 18)" });

  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: { ...ranges.enter(stage), scrub: 0.5 },
    })
    .to(fades, { opacity: 1, duration: 1 }, 0)
    .to(zoom, { scale: 1, opacity: 1, duration: 1 }, 0)
    .to(panel, { "--btn-bg": "rgb(231, 29, 29)", duration: 0.5 }, 0.5);

  initForm(panel);
}

function initForm(panel) {
  const form = panel.querySelector("#subscribe-form");
  const error = form.querySelector(".form__error");
  const button = form.querySelector(".btn");

  const fail = (message) => {
    panel.classList.add("is-error");
    error.textContent = message;
  };
  form.addEventListener("input", () => {
    panel.classList.remove("is-error");
    error.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();

    if (!name) return fail("Please tell us your name.");
    if (!EMAIL_RE.test(email)) return fail("Please enter a valid email address.");

    button.disabled = true;
    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      panel.classList.remove("is-error");
      panel.classList.add("is-success");
    } catch {
      fail("Oops! Something went wrong while submitting the form.");
    } finally {
      button.disabled = false;
    }
  });
}
