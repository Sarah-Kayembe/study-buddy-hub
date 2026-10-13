// Focus Den sounds, generated in the browser with the Web Audio API.
// There are no audio files: chimes are short synthesized tones and each
// ambience is built from filtered noise plus small random events
// (rain drops, fire crackles, bird chirps, piano notes).

let sharedContext = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!sharedContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    sharedContext = new AudioContextClass();
  }
  if (sharedContext.state === "suspended") {
    // Browsers keep audio paused until the page gets a click or key press.
    sharedContext.resume().catch(() => {});
    const resume = () => sharedContext.resume().catch(() => {});
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  }
  return sharedContext;
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function noteToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

// A single tone with a soft attack and an exponential fade.
function tone(ctx, destination, frequency, startAt, duration, { type = "sine", volume = 0.2 } = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

// ------------------------------------------------------------------
// Chimes
// ------------------------------------------------------------------

const CHIMES = {
  // Rising three notes: the session has started.
  start: [72, 76, 79],
  // Two gentle falling notes: time for a break.
  break: [79, 74],
  // A brighter four note arpeggio: session complete.
  finish: [72, 76, 79, 84],
};

export function playChime(kind) {
  const ctx = getContext();
  const notes = CHIMES[kind];
  if (!ctx || !notes) return;
  const now = ctx.currentTime + 0.02;
  notes.forEach((note, i) => {
    const at = now + i * 0.16;
    tone(ctx, ctx.destination, noteToFrequency(note), at, 1.1, { volume: 0.18 });
    tone(ctx, ctx.destination, noteToFrequency(note + 12), at, 0.6, { volume: 0.04 });
  });
}

// ------------------------------------------------------------------
// Noise sources
// ------------------------------------------------------------------

const noiseBuffers = {};

function noiseBuffer(ctx, color) {
  const key = `${color}-${ctx.sampleRate}`;
  if (noiseBuffers[key]) return noiseBuffers[key];

  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === "brown") {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else if (color === "pink") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    } else {
      data[i] = white;
    }
  }
  noiseBuffers[key] = buffer;
  return buffer;
}

function loopNoise(ctx, color, destination, filters, volume, track) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, color);
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  let node = source;
  for (const { type, frequency, Q = 0.7 } of filters) {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    node.connect(filter);
    node = filter;
  }
  node.connect(gain).connect(destination);
  source.start();
  track(source);
  return { source, gain };
}

// Slowly swell a gain up and down so loops don't sound static.
function sway(ctx, gainParam, base, depth, seconds, track) {
  const lfo = ctx.createOscillator();
  const amount = ctx.createGain();
  lfo.frequency.value = 1 / seconds;
  amount.gain.value = depth;
  gainParam.value = base;
  lfo.connect(amount).connect(gainParam);
  lfo.start();
  track(lfo);
  return lfo;
}

// A short burst of filtered noise (rain drop, crackle, clink body).
function burst(ctx, destination, { at, duration, frequency, Q = 1, volume }) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, "white");
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter).connect(gain).connect(destination);
  source.start(at, Math.random() * 2);
  source.stop(at + duration + 0.02);
}

// A simple echo so piano and pads sound like they're in a room.
function echo(ctx, destination, time = 0.32, feedback = 0.35, mix = 0.3) {
  const input = ctx.createGain();
  const delay = ctx.createDelay(1);
  const fb = ctx.createGain();
  const wet = ctx.createGain();
  delay.delayTime.value = time;
  fb.gain.value = feedback;
  wet.gain.value = mix;
  input.connect(destination);
  input.connect(delay);
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(destination);
  return input;
}

// ------------------------------------------------------------------
// Ambience themes
// ------------------------------------------------------------------

// Each theme sets up its sound on `out`, uses `every` to schedule random
// events and passes looping nodes to `track`. The stop function ends them all.
const THEMES = {
  rain(ctx, out, every, track) {
    loopNoise(ctx, "pink", out, [{ type: "highpass", frequency: 400 }, { type: "lowpass", frequency: 7000 }], 0.5, track);
    loopNoise(ctx, "brown", out, [{ type: "lowpass", frequency: 300 }], 0.25, track);
    every(40, 160, () => {
      burst(ctx, out, {
        at: ctx.currentTime,
        duration: random(0.01, 0.04),
        frequency: random(2500, 6000),
        Q: 2,
        volume: random(0.05, 0.18),
      });
    });
  },

  fireplace(ctx, out, every, track) {
    const { gain } = loopNoise(ctx, "brown", out, [{ type: "lowpass", frequency: 450 }], 0.6, track);
    sway(ctx, gain.gain, 0.6, 0.15, 5, track);
    every(60, 450, () => {
      const at = ctx.currentTime;
      const pops = Math.random() < 0.3 ? 3 : 1;
      for (let i = 0; i < pops; i++) {
        burst(ctx, out, {
          at: at + i * random(0.01, 0.05),
          duration: random(0.005, 0.03),
          frequency: random(1500, 4500),
          Q: 3,
          volume: random(0.1, 0.4),
        });
      }
    });
  },

  forest(ctx, out, every, track) {
    const { gain } = loopNoise(ctx, "pink", out, [{ type: "bandpass", frequency: 700, Q: 0.4 }], 0.25, track);
    sway(ctx, gain.gain, 0.25, 0.12, 9, track);
    every(1800, 6000, () => {
      // A bird: two to four quick chirps that sweep upward.
      const chirps = 2 + Math.floor(Math.random() * 3);
      const base = random(2400, 3800);
      const start = ctx.currentTime;
      for (let i = 0; i < chirps; i++) {
        const at = start + i * random(0.09, 0.16);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(base, at);
        osc.frequency.exponentialRampToValueAtTime(base * random(1.2, 1.5), at + 0.07);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.05, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
        osc.connect(g).connect(out);
        osc.start(at);
        osc.stop(at + 0.1);
      }
    });
  },

  cafe(ctx, out, every, track) {
    // Room murmur: brown noise shaped into the range of voices.
    const { gain } = loopNoise(ctx, "brown", out, [
      { type: "bandpass", frequency: 500, Q: 0.6 },
      { type: "lowpass", frequency: 1400 },
    ], 0.9, track);
    sway(ctx, gain.gain, 0.9, 0.25, 3.5, track);
    every(3500, 9000, () => {
      // A cup or spoon clink.
      const at = ctx.currentTime;
      tone(ctx, out, random(2400, 2800), at, 0.4, { volume: 0.04 });
      tone(ctx, out, random(3600, 4200), at, 0.25, { volume: 0.025 });
    });
  },

  piano(ctx, out, every) {
    const room = echo(ctx, out, 0.38, 0.3, 0.35);
    const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79];
    every(900, 2400, () => {
      const at = ctx.currentTime;
      const note = scale[Math.floor(Math.random() * scale.length)];
      const play = (midi, delay) => {
        tone(ctx, room, noteToFrequency(midi), at + delay, 2.6, { type: "triangle", volume: 0.07 });
        tone(ctx, room, noteToFrequency(midi + 12), at + delay, 1.2, { volume: 0.015 });
      };
      play(note, 0);
      if (Math.random() < 0.35) play(note - 12, 0.02);
    });
  },

  celestial(ctx, out, every) {
    const room = echo(ctx, out, 0.5, 0.45, 0.4);
    const chords = [
      [57, 64, 69, 73],
      [53, 60, 65, 69],
      [55, 62, 67, 71],
      [52, 59, 64, 68],
    ];
    let index = 0;
    const playChord = () => {
      const at = ctx.currentTime;
      chords[index % chords.length].forEach((midi) => {
        [-4, 4].forEach((detune) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.frequency.value = noteToFrequency(midi);
          osc.detune.value = detune;
          g.gain.setValueAtTime(0.0001, at);
          g.gain.exponentialRampToValueAtTime(0.018, at + 2.5);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 9);
          osc.connect(g).connect(room);
          osc.start(at);
          osc.stop(at + 9.1);
        });
      });
      index += 1;
    };
    playChord();
    every(7000, 7000, playChord);
    every(1500, 4000, () => {
      // A small twinkle on top.
      const note = [81, 84, 86, 88, 91][Math.floor(Math.random() * 5)];
      tone(ctx, room, noteToFrequency(note), ctx.currentTime, 1.5, { volume: 0.02 });
    });
  },
};

export const AMBIENCE_THEMES = [
  { id: "forest", label: "Forest" },
  { id: "cafe", label: "Cafe" },
  { id: "rain", label: "Rain" },
  { id: "fireplace", label: "Fireplace" },
  { id: "piano", label: "Piano" },
  { id: "celestial", label: "Celestial" },
];

// Start a looping ambience. Returns a function that fades it out and stops it.
export function startAmbience(themeId, volume = 0.35) {
  const ctx = getContext();
  const theme = THEMES[themeId] || THEMES.forest;
  if (!ctx) return () => {};

  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, ctx.currentTime);
  out.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 1.5);
  out.connect(ctx.destination);

  // Track every source we start so stopping cleans them all up.
  const timers = new Set();
  let stopped = false;
  const every = (minMs, maxMs, fn) => {
    const schedule = () => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (stopped) return;
        if (ctx.state === "running") fn();
        schedule();
      }, random(minMs, maxMs));
      timers.add(id);
    };
    schedule();
  };

  const looping = [];
  theme(ctx, out, every, (node) => looping.push(node));

  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
    timers.clear();
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => {
      looping.forEach((node) => {
        try {
          node.stop();
        } catch {
          // Already stopped.
        }
      });
      out.disconnect();
    }, 500);
  };
}
