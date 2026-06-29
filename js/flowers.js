// Blossoming flowers — HTML from Md Usman Ansari (CodePen BamepLe)
// https://codepen.io/mdusmanansari/pen/BamepLe

const STEM = "#5a9e5a";

function flowerLights() {
  return Array.from({ length: 8 }, (_, i) =>
    `<div class="flower__light flower__light--${i + 1}"></div>`
  ).join("");
}

function lineLeaves(count) {
  return Array.from({ length: count }, (_, i) =>
    `<div class="flower__line__leaf flower__line__leaf--${i + 1}"></div>`
  ).join("");
}

function blossomFlower(num, lineLeafCount, field = false) {
  const lights = field ? "" : flowerLights();
  const leaves = field ? lineLeaves(Math.min(lineLeafCount, 4)) : lineLeaves(lineLeafCount);
  return `
    <div class="flower flower--${num}">
      <div class="flower__leafs flower__leafs--${num}">
        <div class="flower__leaf flower__leaf--1"></div>
        <div class="flower__leaf flower__leaf--2"></div>
        <div class="flower__leaf flower__leaf--3"></div>
        <div class="flower__leaf flower__leaf--4"></div>
        <div class="flower__white-circle"></div>
        ${lights}
      </div>
      <div class="flower__line">
        ${leaves}
      </div>
    </div>`;
}

/** Seeded layout so the field looks natural but stays consistent on reload. */
const FIELD_LAYOUT = (() => {
  let seed = 20260529;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const count = 44;
  const items = [];
  for (let i = 0; i < count; i++) {
    const scale = 0.10 + rand() * 0.09;
    items.push({
      x: 1 + rand() * 98,
      y: rand() * 10,
      scale,
      rot: -16 + rand() * 32,
      variant: (i % 3) + 1,
      z: Math.round(scale * 40) + (i % 3),
      swayDelay: rand() * 4,
      bloomDelay: rand() * 1.2,
    });
  }
  return items.sort((a, b) => a.z - b.z);
})();

function bloomInstance(layout, index) {
  const lineLeaves = layout.variant === 1 ? 4 : 3;
  return `
    <div class="bloom-instance" style="
      --x: ${layout.x.toFixed(1)}%;
      --y: ${layout.y.toFixed(1)}%;
      --scale: ${layout.scale.toFixed(3)};
      --rot: ${layout.rot.toFixed(1)}deg;
      --z: ${layout.z};
      --sway-delay: ${layout.swayDelay.toFixed(2)}s;
      --bloom-delay: ${layout.bloomDelay.toFixed(2)}s;
    ">
      ${blossomFlower(layout.variant, lineLeaves, true)}
    </div>`;
}

function buildFlowerField() {
  return `
    <div class="blooming-garden__field">
      ${FIELD_LAYOUT.map((layout, i) => bloomInstance(layout, i)).join("")}
    </div>`;
}

const BLOSSOMING_GARDEN_HTML = buildFlowerField();

export function initMainFlowers() {
  const container = document.getElementById("blooming-garden");
  if (!container) return;

  container.innerHTML = BLOSSOMING_GARDEN_HTML;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    container.classList.remove("not-loaded");
    return;
  }

  setTimeout(() => {
    container.classList.remove("not-loaded");
  }, 400);
}

// Small scatter blooms for background layers
function petalPath(len = 13, width = 5) {
  return `<path d="M0 ${-len} Q${width} ${-len * 0.4} 0 2 Q${-width} ${-len * 0.4} 0 ${-len}"
    fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`;
}

export function simplePeony(outer = "#ffb3c6", inner = "#ffc8dd", stroke = "#d492a8") {
  function peonyPetal(rot, color, spread, height) {
    return `<g transform="rotate(${rot})">
      <path d="M0 2 Q${spread} ${-height * 0.45} 0 ${-height} Q${-spread} ${-height * 0.45} 0 2"
        fill="${color}" stroke="${stroke}" stroke-width="0.75" stroke-linejoin="round"/>
    </g>`;
  }
  const petals = [0, 60, 120, 180, 240, 300]
    .map((a) => peonyPetal(a, outer, 5, 9))
    .join("");
  const innerPetals = [30, 90, 150, 210, 270, 330]
    .map((a) => peonyPetal(a, inner, 3.5, 6))
    .join("");
  return `<svg viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="24" x2="18" y2="46" stroke="${STEM}" stroke-width="1.5" stroke-linecap="round"/>
    <g transform="translate(18 22)">
      ${petals}${innerPetals}
      <circle r="2.5" fill="#f4d03f" stroke="${stroke}" stroke-width="0.5"/>
    </g>
  </svg>`;
}

export function simpleDaisy(petalColor = "#ffb3c6") {
  return `<svg viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="18" x2="16" y2="40" stroke="${STEM}" stroke-width="1.5" stroke-linecap="round"/>
    <g transform="translate(16 14)">
      <g style="color:${petalColor}">${[0, 72, 144, 216, 288].map((a) => `<g transform="rotate(${a})">${petalPath(9, 3.5)}</g>`).join("")}</g>
      <circle r="3.5" fill="#f4d03f"/>
    </g>
  </svg>`;
}

export function simpleDot(color = "#ffafcc") {
  return `<svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="14" x2="12" y2="32" stroke="${STEM}" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="12" cy="10" r="6" fill="${color}" stroke="#c97a90" stroke-width="0.8"/>
    <circle cx="12" cy="10" r="2" fill="#f4d03f"/>
  </svg>`;
}

export function simpleSprig(color = "#c9b1ff") {
  return `<svg viewBox="0 0 20 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 14 L10 36" stroke="${STEM}" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="10" cy="10" r="4" fill="${color}" stroke="#9a82c8" stroke-width="0.7"/>
    <circle cx="7" cy="16" r="3" fill="${color}" opacity="0.85"/>
    <circle cx="13" cy="20" r="2.5" fill="${color}" opacity="0.8"/>
  </svg>`;
}
