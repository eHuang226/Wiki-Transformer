import { CONFIG } from "./config.js";
import { initCreatures } from "./creatures.js";
import { initAudio } from "./audio.js";
import { initBackgroundGarden } from "./background.js";
import { alignRidgeTrees } from "./landscape.js";
import { initMainFlowers } from "./flowers.js";

const PETAL_COLORS = ["#ffb3c6", "#ff8fab", "#ffc8dd", "#f4a6c4", "#ffafcc"];
const PETAL_COUNT = 25;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function injectContent() {
  document.title = CONFIG.headline;
  document.getElementById("headline").textContent = CONFIG.headline;
  document.getElementById("greeting").textContent = `Dear ${CONFIG.momsName},`;
  document.getElementById("message").textContent = CONFIG.message.trim();
  document.getElementById("signature").textContent = CONFIG.signature;
  document.getElementById("your-name").textContent = CONFIG.yourName;

  const bouquet = document.getElementById("bouquet");
  if (CONFIG.showReasonBouquet && CONFIG.reasons?.length) {
    CONFIG.reasons.forEach((reason) => {
      const li = document.createElement("li");
      li.className = "bouquet-item";
      li.innerHTML = `<span class="bouquet-item__bloom" aria-hidden="true">🌸</span><span>${reason}</span>`;
      bouquet.appendChild(li);
    });
  }
}

function revealContent() {
  document.getElementById("message-card").classList.add("is-visible");
  document.querySelector(".signature-block").classList.add("is-visible");
  document.querySelectorAll(".bouquet-item").forEach((item) => {
    item.classList.add("is-visible");
  });
}

function createPetal(layer, overrides = {}) {
  const petal = document.createElement("div");
  petal.className = "petal";
  const size = overrides.size ?? 8 + Math.random() * 14;
  const left = overrides.left ?? Math.random() * 100;
  const duration = overrides.duration ?? 8 + Math.random() * 12;
  const delay = overrides.delay ?? Math.random() * duration;
  const driftX = (Math.random() - 0.5) * 120;
  const driftRot = 180 + Math.random() * 540;
  const opacity = 0.55 + Math.random() * 0.3;

  petal.style.cssText = `
    width: ${size}px;
    height: ${size * 0.7}px;
    left: ${left}%;
    background: ${PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]};
    --drift-x: ${driftX}px;
    --drift-rot: ${driftRot}deg;
    --petal-opacity: ${opacity};
    animation-duration: ${duration}s;
    animation-delay: ${delay}s;
  `;
  layer.appendChild(petal);
  return petal;
}

function initPetals() {
  if (prefersReducedMotion) return;
  const layer = document.getElementById("petal-layer");
  for (let i = 0; i < PETAL_COUNT; i++) {
    createPetal(layer);
  }
}

function spawnSparkle(x, y) {
  const dot = document.createElement("div");
  dot.className = "sparkle-dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 800);
}

function initClickSparkles() {
  document.getElementById("garden").addEventListener("click", (e) => {
    if (e.target.closest(".audio-toggle")) return;
    spawnSparkle(e.clientX, e.clientY);
    if (prefersReducedMotion) return;
    const layer = document.getElementById("petal-layer");
    for (let i = 0; i < 4; i++) {
      createPetal(layer, {
        size: 6 + Math.random() * 8,
        left: (e.clientX / window.innerWidth) * 100 + (Math.random() - 0.5) * 10,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 0.3,
      });
    }
  });
}

injectContent();
initMainFlowers();
revealContent();
alignRidgeTrees();
initBackgroundGarden();
initPetals();
initClickSparkles();

if (CONFIG.enableCreatures && !prefersReducedMotion) {
  initCreatures();
}

if (CONFIG.enableAudio && !prefersReducedMotion) {
  initAudio();
}
