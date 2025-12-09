/**
 * PLAČI - Settings Page
 * Handles configuration UI and persistence
 */

import { CONFIG } from "./config.js";

// Default configuration
const DEFAULTS = {
  minFreq: 100,
  maxFreq: 1000,
  chargeRate: 0.03, // Breath intake speed
  depleteRate: 0.015, // Breath release speed
  threshold: 0.1, // Capacity needed before sound begins
  maxVolume: 4.0, // Maximum output volume intensity
  micSensitivity: 16,
  vibrato: 3,
  filterQ: 1.0,
  debugMode: false,
};

/**
 * Load settings from localStorage or use defaults
 */
function loadSettings() {
  const saved = localStorage.getItem("placi_settings");
  if (saved) {
    try {
      return { ...DEFAULTS, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Error loading settings:", e);
      return DEFAULTS;
    }
  }
  return DEFAULTS;
}

/**
 * Save settings to localStorage and update CONFIG
 */
function saveSettings(settings) {
  localStorage.setItem("placi_settings", JSON.stringify(settings));

  // Update CONFIG object
  CONFIG.frequency.min = settings.minFreq;
  CONFIG.frequency.max = settings.maxFreq;
  CONFIG.breathing.chargeRate = settings.chargeRate;
  CONFIG.breathing.depleteRate = settings.depleteRate;
  CONFIG.breathing.threshold = settings.threshold;
  CONFIG.audio.maxVolume = settings.maxVolume;
  CONFIG.audio.micSensitivity = settings.micSensitivity;
  CONFIG.audio.vibrato = settings.vibrato;
  CONFIG.audio.filterQ = settings.filterQ;
  CONFIG.debug.enabled = settings.debugMode;
}

/**
 * Initialize all sliders with current values
 */
function initializeUI(settings) {
  // Frequency
  document.getElementById("minFreq").value = settings.minFreq;
  document.getElementById("maxFreq").value = settings.maxFreq;
  document.getElementById("minFreqValue").textContent = settings.minFreq;
  document.getElementById("maxFreqValue").textContent = settings.maxFreq;

  // Breathing
  document.getElementById("chargeRate").value = settings.chargeRate;
  document.getElementById("depleteRate").value = settings.depleteRate;
  document.getElementById("threshold").value = settings.threshold;
  document.getElementById("chargeRateValue").textContent =
    settings.chargeRate.toFixed(3);
  document.getElementById("depleteRateValue").textContent =
    settings.depleteRate.toFixed(3);
  document.getElementById("thresholdValue").textContent =
    settings.threshold.toFixed(2);

  // Audio
  document.getElementById("maxVolume").value = settings.maxVolume;
  document.getElementById("micSensitivity").value = settings.micSensitivity;
  document.getElementById("vibrato").value = settings.vibrato;
  document.getElementById("maxVolumeValue").textContent =
    settings.maxVolume.toFixed(2);
  document.getElementById("micSensitivityValue").textContent =
    settings.micSensitivity;
  document.getElementById("vibratoValue").textContent = settings.vibrato;

  // Filter
  document.getElementById("filterQ").value = settings.filterQ;
  document.getElementById("filterQValue").textContent =
    settings.filterQ.toFixed(1);

  // Debug
  document.getElementById("debugMode").checked = settings.debugMode;
}

/**
 * Register event listeners for all controls
 */
function registerEventListeners() {
  const settings = loadSettings();

  // Helper to update value display and save
  const createChangeHandler = (id, valueId, formatter = (v) => v) => {
    const input = document.getElementById(id);
    const display = document.getElementById(valueId);

    input.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      display.textContent = formatter(value);

      // Update settings object
      const key = id.replace(/([A-Z])/g, (match) => match.toLowerCase());

      // Map UI IDs to settings keys
      const keyMap = {
        minfreq: "minFreq",
        maxfreq: "maxFreq",
        chargerate: "chargeRate",
        depleterate: "depleteRate",
        threshold: "threshold",
        maxvolume: "maxVolume",
        micsensitivity: "micSensitivity",
        vibrato: "vibrato",
        filterq: "filterQ",
      };

      const settingsKey = keyMap[key] || key;
      settings[settingsKey] = value;
      saveSettings(settings);
    });
  };

  // Register all sliders
  createChangeHandler("minFreq", "minFreqValue", (v) => v.toFixed(0));
  createChangeHandler("maxFreq", "maxFreqValue", (v) => v.toFixed(0));
  createChangeHandler("chargeRate", "chargeRateValue", (v) => v.toFixed(3));
  createChangeHandler("depleteRate", "depleteRateValue", (v) => v.toFixed(3));
  createChangeHandler("threshold", "thresholdValue", (v) => v.toFixed(2));
  createChangeHandler("maxVolume", "maxVolumeValue", (v) => v.toFixed(2));
  createChangeHandler("micSensitivity", "micSensitivityValue", (v) =>
    v.toFixed(0),
  );
  createChangeHandler("vibrato", "vibratoValue", (v) => v.toFixed(1));
  createChangeHandler("filterQ", "filterQValue", (v) => v.toFixed(1));

  // Debug mode checkbox
  document.getElementById("debugMode").addEventListener("change", (e) => {
    settings.debugMode = e.target.checked;
    saveSettings(settings);
  });

  // Reset button
  document.getElementById("resetButton").addEventListener("click", () => {
    if (confirm("Reset all settings to defaults?")) {
      localStorage.removeItem("placi_settings");
      initializeUI(DEFAULTS);
      saveSettings(DEFAULTS);
    }
  });
}

/**
 * Initialize settings page
 */
function init() {
  const settings = loadSettings();
  saveSettings(settings); // Apply to CONFIG
  initializeUI(settings);
  registerEventListeners();
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
