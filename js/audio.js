let audioCtx = null;
let isPlaying = false;
let nodes = [];

function createAmbientSound() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.98 + white * 0.02;
    output[i] = last * 0.4;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.08;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();

  nodes.push(noise, filter, gain);

  function chirp() {
    if (!isPlaying || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const chirpGain = audioCtx.createGain();
    const freq = 1800 + Math.random() * 1200;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, audioCtx.currentTime + 0.08);
    chirpGain.gain.setValueAtTime(0, audioCtx.currentTime);
    chirpGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.02);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(chirpGain);
    chirpGain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
    setTimeout(chirp, 3000 + Math.random() * 8000);
  }

  setTimeout(chirp, 2000 + Math.random() * 4000);
}

function stopAmbient() {
  nodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      node.disconnect();
    } catch {
      /* already stopped */
    }
  });
  nodes = [];
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

export function initAudio() {
  const btn = document.getElementById("audio-toggle");
  if (!btn) return;

  btn.classList.remove("hidden");

  btn.addEventListener("click", async () => {
    if (isPlaying) {
      isPlaying = false;
      stopAmbient();
      btn.classList.remove("is-playing");
      btn.setAttribute("aria-label", "Play garden sounds");
      return;
    }

    isPlaying = true;
    createAmbientSound();
    if (audioCtx?.state === "suspended") {
      await audioCtx.resume();
    }
    btn.classList.add("is-playing");
    btn.setAttribute("aria-label", "Pause garden sounds");
  });
}
