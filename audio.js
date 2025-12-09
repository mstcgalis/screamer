/**
 * PLAČI - Audio System
 * Authentic Slavic Ritual Vocal Sound
 * Multi-oscillator + formants + breath + reverb + heartbeat
 */

import { CONFIG } from "./config.js";
import { state } from "./state.js";

/**
 * Phrygian scale ratios (dark Slavic modal sound)
 */
const PHRYGIAN_RATIOS = [
  1.0, // A
  1.067, // Bb (minor 2nd)
  1.2, // C (minor 3rd)
  1.33, // D (perfect 4th)
  1.5, // E (perfect 5th)
  1.6, // F (minor 6th)
  1.78, // G (minor 7th)
  2.0, // A (octave)
];

/**
 * Creates and configures the Web Audio API context
 */
function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

/**
 * Sets up microphone input with analyser for volume detection
 */
async function setupMicrophoneInput(audioContext) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const microphone = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = CONFIG.audio.fftSize;
  analyser.smoothingTimeConstant = CONFIG.audio.smoothingTime;
  microphone.connect(analyser);

  // Create reusable buffer for performance (prevents GC pressure)
  state.micDataArray = new Uint8Array(analyser.frequencyBinCount);

  return { microphone, analyser, stream };
}

/**
 * Create reverb impulse response (6 second cathedral tail)
 */
function createReverbImpulse(audioContext, duration = 6) {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Slower decay for sacred space
      const decay = Math.pow(1 - i / length, 2);
      // Add early reflections
      const early = i < sampleRate * 0.05 ? Math.random() * 0.5 : 0;
      channelData[i] = (Math.random() * 2 - 1) * decay + early;
    }
  }
  return impulse;
}

/**
 * Create breath noise buffer
 */
function createBreathNoise(audioContext) {
  const noiseBuffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * 2,
    audioContext.sampleRate,
  );
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/**
 * Sets up complete ritual vocal audio system
 */
function setupAudioOutput(audioContext, frequency) {
  // === 1. Create 5 oscillators with harmonic series ===
  const partials = [
    { ratio: 1.0, gain: 0.8 }, // fundamental
    { ratio: 2.0, gain: 0.4 }, // octave
    { ratio: 3.0, gain: 0.25 }, // fifth + octave
    { ratio: 4.0, gain: 0.15 }, // 2 octaves
    { ratio: 5.0, gain: 0.1 }, // major third + 2 octaves
  ];

  const oscillators = partials.map((partial, i) => {
    const osc = audioContext.createOscillator();
    osc.type = "triangle"; // Triangle waves for warm, clean sound
    osc.frequency.value = frequency * partial.ratio;

    // Microtonal detuning (folk tuning)
    osc.detune.value = (Math.random() - 0.5) * (10 + i * 4);

    const gain = audioContext.createGain();
    gain.gain.value = partial.gain;

    osc.connect(gain);
    osc.start();

    return { osc, gain, ratio: partial.ratio };
  });

  // Mix oscillators together
  const oscMix = audioContext.createGain();
  oscillators.forEach(({ gain }) => gain.connect(oscMix));

  // === 2. Add breath noise layer ===
  const noiseBuffer = createBreathNoise(audioContext);
  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  // Filter noise to breathiness (not white noise)
  const breathFilter = audioContext.createBiquadFilter();
  breathFilter.type = "bandpass";
  breathFilter.frequency.value = 1500;
  breathFilter.Q.value = 0.5;

  const breathGain = audioContext.createGain();
  breathGain.gain.value = 0; // Start silent, controlled by updateAudioVolume

  noiseSource.connect(breathFilter);
  breathFilter.connect(breathGain);
  noiseSource.start();

  // === 3. Create formant filters (vowel resonances) ===
  const formant1 = audioContext.createBiquadFilter();
  const formant2 = audioContext.createBiquadFilter();
  const formant3 = audioContext.createBiquadFilter();

  formant1.type = "bandpass";
  formant2.type = "bandpass";
  formant3.type = "bandpass";

  // Default "ah" vowel formants
  formant1.frequency.value = 800;
  formant1.Q.value = 8;
  formant2.frequency.value = 1150;
  formant2.Q.value = 10;
  formant3.frequency.value = 2800;
  formant3.Q.value = 15;

  // Mix breath + oscillators, then through formants
  const preFormantMix = audioContext.createGain();
  oscMix.connect(preFormantMix);
  breathGain.connect(preFormantMix);

  preFormantMix.connect(formant1);
  formant1.connect(formant2);
  formant2.connect(formant3);

  // === 4. Main low-pass filter ===
  const mainFilter = audioContext.createBiquadFilter();
  mainFilter.type = "lowpass";
  mainFilter.Q.value = CONFIG.audio.filterQ;
  mainFilter.frequency.value = 2000;

  formant3.connect(mainFilter);

  // === 5. Reverb (60% wet, 6 second tail) ===
  const convolver = audioContext.createConvolver();
  convolver.buffer = createReverbImpulse(audioContext, 6);

  const dryGain = audioContext.createGain();
  const wetGain = audioContext.createGain();
  dryGain.gain.value = 0.5; // 50% dry
  wetGain.gain.value = 0.8; // 80% wet

  mainFilter.connect(dryGain);
  mainFilter.connect(convolver);
  convolver.connect(wetGain);

  // === 6. Mix dry + wet signals ===
  const mixGain = audioContext.createGain();
  mixGain.gain.value = 3.0; // Strong boost for louder output

  dryGain.connect(mixGain);
  wetGain.connect(mixGain);

  // === 7. Dynamics Compressor (gentle, musical compression) ===
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24; // Moderate threshold
  compressor.knee.value = 30; // Smooth curve
  compressor.ratio.value = 8; // Gentle compression ratio
  compressor.attack.value = 0.01; // 10ms attack
  compressor.release.value = 0.2; // 200ms release

  mixGain.connect(compressor);

  // === 8. Main output gain (user-controlled volume) ===
  const mainGain = audioContext.createGain();
  mainGain.gain.value = 0; // Controlled by breathing mechanics

  compressor.connect(mainGain);

  // === 9. Makeup gain (compensate for compression) ===
  const makeupGain = audioContext.createGain();
  makeupGain.gain.value = 8.0; // High makeup gain for louder output

  mainGain.connect(makeupGain);

  // === 10. Soft limiter (safety net) ===
  const limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.value = -3; // Higher threshold for louder output
  limiter.knee.value = 6; // Soft knee
  limiter.ratio.value = 12; // Limiting ratio
  limiter.attack.value = 0.003; // Fast attack
  limiter.release.value = 0.15; // Medium release

  makeupGain.connect(limiter);
  limiter.connect(audioContext.destination);

  // === 8. Microtonal drift (voices naturally drift) ===
  state.driftInterval = setInterval(() => {
    if (!state.isActive) return; // Skip if not active

    oscillators.forEach(({ osc }) => {
      const driftAmount = (Math.random() - 0.5) * 3;
      osc.detune.linearRampToValueAtTime(
        osc.detune.value + driftAmount,
        audioContext.currentTime + 2,
      );
    });
  }, 2000);

  return {
    oscillators,
    formant1,
    formant2,
    formant3,
    mainFilter,
    breathGain,
    mainGain,
  };
}

/**
 * Initialize complete audio system with microphone input
 */
async function initAudioWithMicrophone() {
  state.audioContext = createAudioContext();

  const { microphone, analyser, stream } = await setupMicrophoneInput(
    state.audioContext,
  );
  state.microphone = microphone;
  state.micAnalyser = analyser;
  state.micStream = stream;

  const audioNodes = setupAudioOutput(
    state.audioContext,
    state.currentFrequency,
  );

  // Store in state
  state.oscillators = audioNodes.oscillators;
  state.formant1 = audioNodes.formant1;
  state.formant2 = audioNodes.formant2;
  state.formant3 = audioNodes.formant3;
  state.mainFilter = audioNodes.mainFilter;
  state.breathGain = audioNodes.breathGain;
  state.gainNode = audioNodes.mainGain;
}

/**
 * Initialize audio system without microphone (fallback)
 */
function initAudioWithoutMicrophone() {
  state.audioContext = createAudioContext();

  const audioNodes = setupAudioOutput(
    state.audioContext,
    state.currentFrequency,
  );

  // Store in state
  state.oscillators = audioNodes.oscillators;
  state.formant1 = audioNodes.formant1;
  state.formant2 = audioNodes.formant2;
  state.formant3 = audioNodes.formant3;
  state.mainFilter = audioNodes.mainFilter;
  state.breathGain = audioNodes.breathGain;
  state.gainNode = audioNodes.mainGain;
}

/**
 * Read current microphone input volume using RMS calculation
 */
export function readMicrophoneVolume() {
  if (!state.micAnalyser || !state.micDataArray || !state.audioContext)
    return 0;

  // Don't process if context is suspended/closed
  if (state.audioContext.state !== "running") return 0;

  // Reuse pre-allocated buffer (prevents GC pressure)
  state.micAnalyser.getByteTimeDomainData(state.micDataArray);

  // Calculate RMS (Root Mean Square) volume
  let sum = 0;
  for (let i = 0; i < state.micDataArray.length; i++) {
    const normalized = (state.micDataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / state.micDataArray.length);

  // Amplify sensitivity and clamp to [0, 1]
  return Math.min(1, rms * CONFIG.audio.micSensitivity);
}

/**
 * Update audio output volume with slow envelope (400ms attack, 1s release)
 */
export function updateAudioVolume(volume) {
  if (!state.gainNode || !state.audioContext) return;

  try {
    const attackTime = 0.4; // 400ms slow fade in
    const releaseTime = 1.0; // 1 second gentle fade out
    const rampTime =
      volume > state.gainNode.gain.value ? attackTime : releaseTime;

    // Cancel any scheduled changes
    state.gainNode.gain.cancelScheduledValues(state.audioContext.currentTime);

    // Set current value
    state.gainNode.gain.setValueAtTime(
      state.gainNode.gain.value,
      state.audioContext.currentTime,
    );

    // Ramp to new value
    state.gainNode.gain.linearRampToValueAtTime(
      volume,
      state.audioContext.currentTime + rampTime,
    );

    // Sync breath noise with capacity
    if (state.breathGain) {
      state.breathGain.gain.cancelScheduledValues(
        state.audioContext.currentTime,
      );
      state.breathGain.gain.setValueAtTime(
        state.breathGain.gain.value,
        state.audioContext.currentTime,
      );
      state.breathGain.gain.linearRampToValueAtTime(
        volume * 0.15,
        state.audioContext.currentTime + rampTime,
      );
    }
  } catch (error) {
    console.error("Error updating audio volume:", error);
  }
}

/**
 * Map horizontal position to Phrygian scale frequency
 */
export function getFrequencyFromPosition(touchX) {
  const baseFreq = 110; // low A
  const octaveRange = 2; // 0-2 octaves (110-440 Hz)

  const octave = Math.floor(touchX * octaveRange);
  const scalePosition = touchX * octaveRange - octave;
  const scaleIndex = Math.floor(scalePosition * PHRYGIAN_RATIOS.length);
  const clampedIndex = Math.min(scaleIndex, PHRYGIAN_RATIOS.length - 1);

  const ratio = PHRYGIAN_RATIOS[clampedIndex];
  return baseFreq * ratio * Math.pow(2, octave);
}

/**
 * Update all oscillator frequencies
 */
export function updateAudioFrequency(baseFreq) {
  if (!state.oscillators || !state.audioContext) return;

  try {
    state.oscillators.forEach(({ osc, ratio }) => {
      osc.frequency.linearRampToValueAtTime(
        baseFreq * ratio,
        state.audioContext.currentTime + CONFIG.visual.transitionTime,
      );
    });
  } catch (error) {
    console.error("Error updating audio frequency:", error);
  }
}

/**
 * Update formant filters (vowel morph: "oo" → "ah")
 * Y-axis: bottom = "oo" (dark, closed), top = "ah" (bright, open)
 */
export function updateFormants(touchY) {
  if (!state.formant1 || !state.audioContext) return;

  const time = state.audioContext.currentTime + CONFIG.visual.transitionTime;

  // Low Y: [300, 870, 2240] = "oo" (dark, closed)
  // High Y: [800, 1150, 2800] = "ah" (bright, open)
  const f1 = 300 + touchY * 500;
  const f2 = 870 + touchY * 280;
  const f3 = 2240 + touchY * 560;

  state.formant1.frequency.linearRampToValueAtTime(f1, time);
  state.formant2.frequency.linearRampToValueAtTime(f2, time);
  state.formant3.frequency.linearRampToValueAtTime(f3, time);
}

/**
 * Update main filter cutoff frequency (brightness control)
 */
export function updateFilterCutoff(cutoff) {
  if (state.mainFilter && state.audioContext) {
    state.mainFilter.frequency.linearRampToValueAtTime(
      cutoff,
      state.audioContext.currentTime + CONFIG.visual.transitionTime,
    );
  }
}

/**
 * Main audio initialization with graceful fallback
 */
export async function initAudio() {
  // Don't recreate if already exists - reuse AudioContext
  if (state.audioContext && state.audioContext.state !== "closed") {
    console.log("Audio already initialized");
    if (state.audioContext.state === "suspended") {
      await resumeAudioContext();
    }
    return true;
  }

  try {
    await initAudioWithMicrophone();
    console.log("Ritual vocal system initialized with microphone");
    return true;
  } catch (error) {
    console.warn(
      "Microphone not available, using tone generator mode:",
      error.message,
    );

    initAudioWithoutMicrophone();
    return true;
  }
}

/**
 * Resume audio context (for iOS and user gesture requirements)
 */
export async function resumeAudioContext() {
  if (state.audioContext && state.audioContext.state === "suspended") {
    try {
      await state.audioContext.resume();
      console.log("AudioContext resumed");
    } catch (error) {
      console.error("Failed to resume AudioContext:", error);
    }
  }
}

/**
 * Suspend audio context (for page visibility)
 */
export async function suspendAudioContext() {
  if (state.audioContext && state.audioContext.state === "running") {
    try {
      await state.audioContext.suspend();
      console.log("AudioContext suspended");
    } catch (error) {
      console.error("Failed to suspend AudioContext:", error);
    }
  }
}

/**
 * Clean up all audio resources - prevents memory leaks
 */
export async function cleanupAudio() {
  console.log("Cleaning up audio resources...");

  try {
    // Stop and disconnect all oscillators
    if (state.oscillators) {
      state.oscillators.forEach(({ osc, gain }) => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch (e) {
          // Already stopped/disconnected
        }
      });
      state.oscillators = null;
    }

    // Clear microtonal drift interval
    if (state.driftInterval) {
      clearInterval(state.driftInterval);
      state.driftInterval = null;
    }

    // Disconnect all audio nodes
    if (state.formant1) {
      state.formant1.disconnect();
      state.formant1 = null;
    }
    if (state.formant2) {
      state.formant2.disconnect();
      state.formant2 = null;
    }
    if (state.formant3) {
      state.formant3.disconnect();
      state.formant3 = null;
    }
    if (state.mainFilter) {
      state.mainFilter.disconnect();
      state.mainFilter = null;
    }
    if (state.breathGain) {
      state.breathGain.disconnect();
      state.breathGain = null;
    }
    if (state.gainNode) {
      state.gainNode.disconnect();
      state.gainNode = null;
    }

    // Stop microphone stream and disconnect analyser
    if (state.micStream) {
      state.micStream.getTracks().forEach((track) => {
        track.stop();
        console.log("Microphone track stopped");
      });
      state.micStream = null;
    }

    if (state.microphone) {
      state.microphone.disconnect();
      state.microphone = null;
    }

    if (state.micAnalyser) {
      state.micAnalyser.disconnect();
      state.micAnalyser = null;
    }

    // Clear reusable mic data array
    state.micDataArray = null;

    // Close audio context
    if (state.audioContext && state.audioContext.state !== "closed") {
      await state.audioContext.close();
      console.log("AudioContext closed");
    }
    state.audioContext = null;

    console.log("Audio cleanup complete");
  } catch (error) {
    console.error("Error during audio cleanup:", error);
  }
}
