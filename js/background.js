import { simpleDaisy, simpleDot, simpleSprig, simplePeony } from "./flowers.js";

const SCATTER_COLORS = ["#ffb3c6", "#ffc8dd", "#ff8fab", "#ffafcc", "#f4a6c4", "#c9b1ff"];
const PEONY_PAIRS = [
  ["#ff8fab", "#ffb3c6", "#d45f7a"],
  ["#f4a6c4", "#ffc8dd", "#b87a94"],
  ["#ffb3c6", "#ffd6e8", "#d4788f"],
];

const STEM = "#5a9e5a";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

const FLOWER_MAKERS = [
  () => simpleDaisy(pick(SCATTER_COLORS)),
  () => simpleDot(pick(SCATTER_COLORS)),
  () => simpleSprig(pick(SCATTER_COLORS)),
  () => {
    const [outer, inner, stroke] = pick(PEONY_PAIRS);
    return simplePeony(outer, inner, stroke);
  },
];

function grassTuftSvg() {
  return `<svg viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 22 Q7 10 5 4" stroke="${STEM}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M14 22 Q15 8 14 2" stroke="${STEM}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M22 22 Q21 12 23 5" stroke="${STEM}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function placeScatterFlower(container, opts) {
  const el = document.createElement("div");
  el.className = "scatter-flower";
  el.innerHTML = opts.svg();
  el.style.left = `${opts.left}%`;
  el.style.width = `${opts.size}px`;
  el.style.setProperty("--target-opacity", String(opts.opacity ?? 0.7));
  el.style.transform = `rotate(${opts.rotate ?? 0}deg) scale(${opts.scale ?? 1})`;
  if (opts.bottom != null) {
    el.style.bottom = `${opts.bottom}%`;
  }
  el.style.animationDelay = `${opts.delay ?? 0}s`;
  container.appendChild(el);
}

function fillLayer(container, count, sizeRange, opacityRange, bottomVariance) {
  const used = [];
  for (let i = 0; i < count; i++) {
    let left = rand(0, 97);
    let attempts = 0;
    while (attempts < 8 && used.some((u) => Math.abs(u - left) < 5)) {
      left = rand(0, 97);
      attempts++;
    }
    used.push(left);

    placeScatterFlower(container, {
      svg: pick(FLOWER_MAKERS),
      left,
      size: rand(sizeRange[0], sizeRange[1]),
      opacity: rand(opacityRange[0], opacityRange[1]),
      rotate: rand(-10, 10),
      scale: rand(0.9, 1.05),
      delay: rand(0.3, 2.5),
      bottom: bottomVariance ? rand(0, bottomVariance) : 0,
    });
  }
}

function fillGrassTufts(container, count) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "grass-tuft";
    el.innerHTML = grassTuftSvg();
    el.style.left = `${rand(0, 98)}%`;
    el.style.width = `${rand(16, 26)}px`;
    el.style.opacity = rand(0.45, 0.7);
    el.style.transform = `rotate(${rand(-6, 6)}deg)`;
    container.appendChild(el);
  }
}

export function initBackgroundGarden() {
  const mid = document.getElementById("bg-mid-flowers");
  const back = document.getElementById("meadow-back");
  const tufts = document.getElementById("meadow-tufts");

  if (mid) fillLayer(mid, 24, [16, 30], [0.35, 0.55], 12);
  if (back) fillLayer(back, 20, [22, 38], [0.6, 0.85], 6);
  if (tufts) fillGrassTufts(tufts, 30);
}
