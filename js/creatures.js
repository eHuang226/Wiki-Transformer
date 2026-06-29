const BUTTERFLY_VARIANTS = [
  { wing1: "#ff8fab", wing2: "#ffb3c6", body: "#8b3a62" },
  { wing1: "#f4d03f", wing2: "#ffe08a", body: "#6b4423" },
  { wing1: "#c9b1ff", wing2: "#e8d5ff", body: "#5a4080" },
];

function butterflySvg(colors, size) {
  const { wing1, wing2, body } = colors;
  const w = size;
  const h = Math.round(size * 0.72);

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 48 36" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(24 18)">
        <g transform="translate(0 -3)">
          <g class="wing-left">
            <path d="M0 0 C-13 -9 -19 -3 -17 5 C-13 11 -5 9 0 5 Z"
              fill="${wing1}" stroke="${body}" stroke-width="0.7" stroke-linejoin="round"/>
            <path d="M0 5 C-9 7 -13 13 -11 17 C-5 17 -1 13 0 9 Z"
              fill="${wing2}" stroke="${body}" stroke-width="0.6" stroke-linejoin="round"/>
          </g>
          <g class="wing-right">
            <path d="M0 0 C13 -9 19 -3 17 5 C13 11 5 9 0 5 Z"
              fill="${wing1}" stroke="${body}" stroke-width="0.7" stroke-linejoin="round"/>
            <path d="M0 5 C9 7 13 13 11 17 C5 17 1 13 0 9 Z"
              fill="${wing2}" stroke="${body}" stroke-width="0.6" stroke-linejoin="round"/>
          </g>
        </g>
        <ellipse cx="0" cy="1" rx="1.2" ry="7.5" fill="${body}"/>
        <circle cx="0" cy="-8.5" r="1.5" fill="${body}"/>
        <path d="M-1 -8.5 Q-2.5 -11.5 -4 -12.5" stroke="${body}" stroke-width="0.7" fill="none" stroke-linecap="round"/>
        <path d="M1 -8.5 Q2.5 -11.5 4 -12.5" stroke="${body}" stroke-width="0.7" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;
}

function dragonflySvg(size) {
  const uid = `df${Math.random().toString(36).slice(2, 7)}`;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${uid}-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4ecdc4"/>
          <stop offset="100%" stop-color="#7b68ee"/>
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="12" rx="14" ry="2" fill="url(#${uid}-body)"/>
      <circle cx="36" cy="12" r="3" fill="#4ecdc4"/>
      <g class="wing-left" opacity="0.55">
        <ellipse cx="16" cy="6" rx="12" ry="3" fill="#a8e6cf" transform="rotate(-8 16 6)"/>
        <ellipse cx="20" cy="18" rx="10" ry="2.5" fill="#88d8e8" transform="rotate(8 20 18)"/>
      </g>
      <g class="wing-right" opacity="0.55">
        <ellipse cx="32" cy="6" rx="12" ry="3" fill="#a8e6cf" transform="rotate(8 32 6)"/>
        <ellipse cx="28" cy="18" rx="10" ry="2.5" fill="#88d8e8" transform="rotate(-8 28 18)"/>
      </g>
    </svg>`;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function spawnCreature(container, type) {
  const isButterfly = type === "butterfly";
  const onScreen = container.querySelectorAll(`.${type}`).length;
  const maxOnScreen = isButterfly ? 2 : 1;
  if (onScreen >= maxOnScreen) return;

  const el = document.createElement("div");
  const ltr = Math.random() > 0.5;
  const startY = rand(18, 55);
  const duration = isButterfly ? rand(12, 18) : rand(8, 12);
  const size = isButterfly ? rand(32, 42) : rand(36, 48);

  el.className = `creature ${type} ${ltr ? "fly-ltr" : "fly-rtl"}`;
  el.style.setProperty("--start-y", `${startY}%`);
  el.style.setProperty("--flight-duration", `${duration}s`);

  if (isButterfly) {
    const colors = BUTTERFLY_VARIANTS[Math.floor(Math.random() * BUTTERFLY_VARIANTS.length)];
    el.innerHTML = butterflySvg(colors, size);
  } else {
    el.classList.add("dragonfly");
    el.innerHTML = dragonflySvg(size);
  }

  container.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

function scheduleNext(container, type) {
  const delay = type === "butterfly" ? rand(20000, 40000) : rand(50000, 90000);
  setTimeout(() => {
    spawnCreature(container, type);
    scheduleNext(container, type);
  }, delay);
}

export function initCreatures() {
  const container = document.getElementById("sky-creatures");
  if (!container) return;

  setTimeout(() => spawnCreature(container, "butterfly"), rand(3000, 8000));
  setTimeout(() => spawnCreature(container, "dragonfly"), rand(15000, 25000));
  scheduleNext(container, "butterfly");
  scheduleNext(container, "dragonfly");
}
