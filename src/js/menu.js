// Mobile menu: the burger opens a red panel under the top bar. On tablet and
// desktop the links are always visible and the burger is hidden by CSS.
export function initMenu() {
  const menu = document.getElementById("menu");
  const toggle = menu?.querySelector(".menu__toggle");
  const list = menu?.querySelector(".menu__list");
  if (!menu || !toggle || !list) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
  list.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  });
  // Leaving the mobile layout closes the panel.
  window.matchMedia("(min-width: 768px)").addEventListener("change", () => setOpen(false));
}
