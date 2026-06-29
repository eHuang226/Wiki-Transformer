const STEM = "#5a9e5a";
const LEAF = "#6aad6a";

function petalPath(len = 13, width = 5) {
  return `<path d="M0 ${-len} Q${width} ${-len * 0.4} 0 2 Q${-width} ${-len * 0.4} 0 ${-len}"
    fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`;
}

function fivePetalBloom(color, stroke, petalLen = 13) {
  const angles = [0, 72, 144, 216, 288];
  return `<g stroke="${stroke}">${angles
    .map((a) => `<g transform="rotate(${a})" style="color:${color}">${petalPath(petalLen)}</g>`)
    .join("")}</g><circle r="5.5" fill="#f4d03f" stroke="${stroke}" stroke-width="0.8"/>`;
}

function stemAndLeaf(x, yTop, height, leaf = "left") {
  const yBot = yTop + height;
  let leafSvg = "";
  if (leaf === "left") {
    leafSvg = `<path d="M${x - 2} ${yTop + height * 0.45} Q${x - 14} ${yTop + height * 0.35} ${x - 12} ${yTop + height * 0.55} Q${x - 4} ${yTop + height * 0.5} ${x - 2} ${yTop + height * 0.45}" fill="${LEAF}"/>`;
  } else if (leaf === "right") {
    leafSvg = `<path d="M${x + 2} ${yTop + height * 0.5} Q${x + 14} ${yTop + height * 0.42} ${x + 11} ${yTop + height * 0.62} Q${x + 3} ${yTop + height * 0.58} ${x + 2} ${yTop + height * 0.5}" fill="${LEAF}"/>`;
  }
  return `
    <path d="M${x} ${yTop} Q${x + 1} ${yTop + height * 0.5} ${x - 1} ${yBot}" stroke="${STEM}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${leafSvg}`;
}

function cupBloom(color, stroke) {
  return `
    <circle cx="0" cy="-4" r="9" fill="${color}" stroke="${stroke}" stroke-width="1"/>
    <circle cx="-6" cy="-8" r="7" fill="${color}" stroke="${stroke}" stroke-width="0.8" opacity="0.9"/>
    <circle cx="6" cy="-8" r="7" fill="${color}" stroke="${stroke}" stroke-width="0.8" opacity="0.9"/>
    <circle cx="0" cy="-12" r="5" fill="${color}" stroke="${stroke}" stroke-width="0.8" opacity="0.85"/>
    <circle cx="0" cy="-6" r="3" fill="#f0c860" stroke="#c9a030" stroke-width="0.6"/>
  `;
}

function thinPetalBloom(color, stroke) {
  const angles = [0, 72, 144, 216, 288];
  return angles.map((a) => `
    <line x1="0" y1="0" x2="0" y2="-16" stroke="${color}" stroke-width="2.8" stroke-linecap="round" transform="rotate(${a})"/>
  `).join("") + `<circle r="4" fill="#6b4030" stroke="${stroke}" stroke-width="0.6"/>`;
}

function peonyPetal(rot, color, stroke, spread, height) {
  return `<g transform="rotate(${rot})">
    <path d="M0 2 Q${spread} ${-height * 0.45} 0 ${-height} Q${-spread} ${-height * 0.45} 0 2"
      fill="${color}" stroke="${stroke}" stroke-width="0.75" stroke-linejoin="round"/>
  </g>`;
}

function peonyBloom(outer, inner, light, stroke) {
  const outerRing = [0, 51, 102, 153, 204, 255, 306]
    .map((a) => peonyPetal(a, outer, stroke, 7, 13));
  const innerRing = [25, 77, 128, 180, 231, 283, 334]
    .map((a) => peonyPetal(a, inner, stroke, 5, 9));
  const centerRing = [0, 60, 120, 180, 240, 300]
    .map((a) => peonyPetal(a, light, stroke, 3.5, 6));
  return `${outerRing.join("")}${innerRing.join("")}${centerRing.join("")}
    <circle r="3.5" fill="#f4d03f" stroke="${stroke}" stroke-width="0.6"/>`;
}

const MAIN_FLOWERS = [
  {
    className: "flower flower--1",
    viewBox: "0 0 80 120",
    svg: () => `
      ${stemAndLeaf(40, 52, 62, "left")}
      <g transform="translate(40 44)">${fivePetalBloom("#ffb3c6", "#d4788f")}</g>
    `,
  },
  {
    className: "flower flower--2",
    viewBox: "0 0 80 115",
    svg: () => `
      ${stemAndLeaf(42, 48, 58, "right")}
      <g transform="translate(42 40)">${cupBloom("#ff9a7b", "#c96a50")}</g>
    `,
  },
  {
    className: "flower flower--3 flower--tall",
    viewBox: "0 0 80 130",
    svg: () => `
      ${stemAndLeaf(38, 58, 68, "left")}
      <g transform="translate(38 50)">${fivePetalBloom("#ffc8dd", "#d492a8", 15)}</g>
    `,
  },
  {
    className: "flower flower--4",
    viewBox: "0 0 80 110",
    svg: () => `
      ${stemAndLeaf(40, 46, 56)}
      <g transform="translate(40 38)">${fivePetalBloom("#ff8fab", "#d45f7a", 12)}</g>
    `,
  },
  {
    className: "flower flower--5",
    viewBox: "0 0 80 108",
    svg: () => `
      ${stemAndLeaf(39, 45, 55, "right")}
      <g transform="translate(39 37)">${cupBloom("#f4a6c4", "#b87a94")}</g>
    `,
  },
  {
    className: "flower flower--6",
    viewBox: "0 0 80 118",
    svg: () => `
      ${stemAndLeaf(41, 50, 60, "left")}
      <g transform="translate(41 42)">${thinPetalBloom("#c9b1ff", "#8a72b8")}</g>
    `,
  },
  {
    className: "flower flower--7 flower--peony",
    viewBox: "0 0 80 125",
    svg: () => `
      ${stemAndLeaf(40, 54, 64, "right")}
      <g transform="translate(40 42)">${peonyBloom("#ff8fab", "#ffb3c6", "#ffd6e8", "#c95f7a")}</g>
    `,
  },
  {
    className: "flower flower--8 flower--peony flower--tall",
    viewBox: "0 0 80 135",
    svg: () => `
      ${stemAndLeaf(38, 60, 70, "left")}
      <g transform="translate(38 48)">${peonyBloom("#f4a6c4", "#ffc8dd", "#fff0f5", "#b87a94")}</g>
    `,
  },
];

export function initMainFlowers() {
  const container = document.querySelector(".flowers");
  if (!container) return;

  container.innerHTML = MAIN_FLOWERS.map((f) => `
    <div class="${f.className}">
      <svg class="flower-svg" viewBox="${f.viewBox}" xmlns="http://www.w3.org/2000/svg">${f.svg()}</svg>
    </div>
  `).join("");
}

export function simplePeony(outer = "#ffb3c6", inner = "#ffc8dd", stroke = "#d492a8") {
  const petals = [0, 60, 120, 180, 240, 300]
    .map((a) => peonyPetal(a, outer, stroke, 5, 9))
    .join("");
  const innerPetals = [30, 90, 150, 210, 270, 330]
    .map((a) => peonyPetal(a, inner, stroke, 3.5, 6))
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
