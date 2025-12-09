/**
 * PLAČI - Main Application
 * Coordinates all modules, handles events, and runs the main loop
 */

import { CONFIG } from "./config.js";
import { state } from "./state.js";
import {
  initAudio,
  readMicrophoneVolume,
  updateAudioVolume,
  updateAudioFrequency,
  updateFormants,
  updateFilterCutoff,
  getFrequencyFromPosition,
  resumeAudioContext,
  suspendAudioContext,
} from "./audio.js";
import {
  chargeBreathCapacity,
  depleteBreathCapacity,
  calculateOutputVolume,
} from "./breathing.js";
import { dom, updateVisuals } from "./visuals.js";

// ============================================================
// MAIN BREATHING LOOP
// ============================================================

/**
 * Main animation loop - processes breathing mechanics and updates visuals
 */
function breathingLoop() {
  if (!state.isActive) return;

  // In debug mode, skip breathing mechanics entirely
  if (state.debugModeActive) {
    state.inputVolume = 0;
    state.breathCapacity = 0;
    state.outputVolume = calculateOutputVolume(); // Returns 0.5 for debug mode
    updateAudioVolume(state.outputVolume);
    updateVisuals();
    requestAnimationFrame(breathingLoop);
    return;
  }

  // Normal mode: Read microphone input and update breathing
  state.inputVolume = readMicrophoneVolume();

  // Update breathing mechanics
  chargeBreathCapacity(state.inputVolume);
  depleteBreathCapacity();

  // Calculate and apply output volume
  state.outputVolume = calculateOutputVolume();
  updateAudioVolume(state.outputVolume);

  // Update visual feedback
  updateVisuals();

  // Continue loop
  requestAnimationFrame(breathingLoop);
}

// ============================================================
// X-Y PAD CONTROL
// ============================================================

/**
 * Update frequency and formants from user interaction position
 * X-axis: Phrygian scale frequency
 * Y-axis: Vowel morph ("oo" → "ah")
 */
function updateFrequencyFromPosition(event) {
  event.preventDefault();

  const touch = event.touches ? event.touches[0] : event;

  // X-axis: Phrygian scale frequency control
  state.touchX = touch.clientX / window.innerWidth;
  const newFrequency = getFrequencyFromPosition(state.touchX);
  state.currentFrequency = newFrequency;
  updateAudioFrequency(state.currentFrequency);

  // Y-axis: Formant vowel morph control
  state.touchY = 1 - touch.clientY / window.innerHeight;
  updateFormants(state.touchY);

  // Update visual feedback immediately
  updateVisuals();
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handle first interaction - initialize audio system
 */
async function handleInteractionStart(event) {
  if (!state.isActive) {
    if (state.audioContext) {
      resumeAudioContext();
    } else {
      await initAudio();
      state.isActive = true;
      requestAnimationFrame(breathingLoop);
    }
    return;
  }

  updateFrequencyFromPosition(event);
}

/**
 * Handle drag/move interaction - update frequency
 */
function handleInteractionMove(event) {
  if (!state.isActive) return;
  updateFrequencyFromPosition(event);
}

/**
 * Handle mouse move (only when button is pressed)
 */
function handleMouseMove(event) {
  if (event.buttons === 1) {
    handleInteractionMove(event);
  }
}

/**
 * Handle visibility change - pause/resume audio
 */
function handleVisibilityChange() {
  if (!state.audioContext) return;

  if (document.hidden) {
    suspendAudioContext();
  } else {
    resumeAudioContext();
  }
}

/**
 * iOS-specific: resume audio context on touch
 */
function handleIOSAudioResume() {
  if (state.audioContext && state.audioContext.state === "suspended") {
    resumeAudioContext();
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Load settings from localStorage and apply to CONFIG
 */
function loadSettings() {
  const saved = localStorage.getItem("placi_settings");
  if (saved) {
    try {
      const settings = JSON.parse(saved);

      // Apply to CONFIG
      if (settings.minFreq !== undefined)
        CONFIG.frequency.min = settings.minFreq;
      if (settings.maxFreq !== undefined)
        CONFIG.frequency.max = settings.maxFreq;
      if (settings.chargeRate !== undefined)
        CONFIG.breathing.chargeRate = settings.chargeRate;
      if (settings.depleteRate !== undefined)
        CONFIG.breathing.depleteRate = settings.depleteRate;
      if (settings.threshold !== undefined)
        CONFIG.breathing.threshold = settings.threshold;
      if (settings.maxVolume !== undefined)
        CONFIG.audio.maxVolume = settings.maxVolume;
      if (settings.micSensitivity !== undefined)
        CONFIG.audio.micSensitivity = settings.micSensitivity;
      if (settings.vibrato !== undefined)
        CONFIG.audio.vibrato = settings.vibrato;
      if (settings.filterQ !== undefined)
        CONFIG.audio.filterQ = settings.filterQ;
      if (settings.debugMode !== undefined)
        CONFIG.debug.enabled = settings.debugMode;

      console.log("Settings loaded from localStorage");
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  }
}

/**
 * Register all event listeners
 */
function registerEventListeners() {
  // Touch events
  dom.container.addEventListener("touchstart", handleInteractionStart, {
    passive: false,
  });
  dom.container.addEventListener("touchmove", handleInteractionMove, {
    passive: false,
  });
  dom.container.addEventListener("touchend", (e) => e.preventDefault(), {
    passive: false,
  });

  // Mouse events
  dom.container.addEventListener("mousedown", handleInteractionStart);
  dom.container.addEventListener("mousemove", handleMouseMove);

  // Visibility change
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // iOS-specific audio resume
  document.addEventListener("touchstart", handleIOSAudioResume, {
    once: false,
  });

  // Debug mode: test sound button (toggle audio on/off)
  const testButton = document.getElementById("testSoundButton");
  if (testButton) {
    testButton.addEventListener("click", async () => {
      if (!state.isActive) {
        // Turn audio ON
        await initAudio();
        state.isActive = true;
        state.debugModeActive = true; // Enable debug override for continuous sound
        requestAnimationFrame(breathingLoop);
        testButton.textContent = "⏸"; // Pause symbol when playing
      } else {
        // Turn audio OFF
        state.isActive = false;
        state.debugModeActive = false; // Disable debug override
        state.breathCapacity = 0;
        updateAudioVolume(0);
        testButton.textContent = "▶"; // Play symbol when stopped
      }
    });
  }
}

/**
 * Show or hide debug controls based on CONFIG.debug.enabled
 */
function updateDebugControls() {
  const testButton = document.getElementById("testSoundButton");
  if (testButton) {
    testButton.style.display = CONFIG.debug.enabled ? "block" : "none";
  }
}

/**
 * Initialize the application
 */
function init() {
  loadSettings();
  updateDebugControls();
  registerEventListeners();
  console.log("Plači initialized. Tap to begin.");
}

// Debug interface (development only)
if (typeof window !== "undefined") {
  window.__placi_debug = {
    getState: () => state,
    testSound: async () => {
      if (!state.isActive) {
        await initAudio();
        state.isActive = true;
        requestAnimationFrame(breathingLoop);
      }
      // Force some output
      state.breathCapacity = 1.0;
      state.outputVolume = 0.8;
      updateAudioVolume(0.8);
      return "Sound test initiated";
    },
    simulateInput: (volume) => {
      state.inputVolume = volume;
    },
  };
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
