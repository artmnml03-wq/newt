const TEXT = "Last update: 09/11/2024 // IG MX";
const GROUP_ITEMS = 8;

// The track holds two identical groups; translating by -50% loops seamlessly.
export function initTicker() {
  const track = document.querySelector(".ticker__track");
  if (!track) return;

  const makeGroup = () => {
    const group = document.createElement("div");
    group.className = "ticker__group caption";
    for (let i = 0; i < GROUP_ITEMS; i++) {
      const item = document.createElement("span");
      item.textContent = TEXT;
      group.append(item);
      const dash = document.createElement("span");
      dash.textContent = "–";
      group.append(dash);
    }
    return group;
  };

  const first = makeGroup();
  const second = makeGroup();
  second.setAttribute("aria-hidden", "true");
  track.append(first, second);
}
