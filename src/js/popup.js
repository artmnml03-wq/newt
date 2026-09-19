const DELAY_MS = 10_000;
const STORAGE_KEY = "newt:popup-seen";

// Welcome pop-up: opens 10 seconds after load (once per browser session).
export function initPopup() {
  const popup = document.getElementById("popup");
  if (!popup) return;

  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
  } catch {
    /* storage unavailable — show anyway */
  }

  const close = popup.querySelector(".popup__close");
  const cta = popup.querySelector(".popup__cta");
  let opener = null;

  const open = () => {
    opener = document.activeElement;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    close.focus({ preventScroll: true });
    document.addEventListener("keydown", onKey);
  };

  const hide = () => {
    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onKey);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    opener?.focus?.({ preventScroll: true });
  };

  const onKey = (event) => {
    if (event.key === "Escape") hide();
    if (event.key === "Tab") {
      // Keep focus inside the dialog (two focusable elements).
      event.preventDefault();
      (document.activeElement === close ? cta : close).focus();
    }
  };

  close.addEventListener("click", hide);
  cta.addEventListener("click", hide);
  popup.addEventListener("click", (event) => {
    if (event.target === popup) hide();
  });

  window.setTimeout(open, DELAY_MS);
}
