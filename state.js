/**
 * PLAČI - Application State
 * Central state management for the application
 */

import { CONFIG } from "./config.js";

/**
 * Application state object
 * Contains all mutable state including audio nodes and app variables
 */
export const state = {
  // Audio nodes
  audioContext: null,
  oscillators: null, // Array of 5 oscillators with harmonic series
  gainNode: null, // Main output gain
  formant1: null, // First formant filter
  formant2: null, // Second formant filter
  formant3: null, // Third formant filter
  mainFilter: null, // Main low-pass filter
  breathGain: null, // Breath noise gain
  microphone: null,
  micAnalyser: null,
  micDataArray: null, // Reusable buffer for microphone data (performance optimization)
  driftInterval: null, // Interval ID for microtonal drift animation

  // App state
  isActive: false,
  debugModeActive: false, // Debug mode audio override
  breathCapacity: 0.0,
  currentFrequency: CONFIG.frequency.default,
  filterCutoff: 2000,
  inputVolume: 0.0,
  outputVolume: 0.0,

  // Touch position (0-1 normalized)
  touchX: 0.5,
  touchY: 0.5,
};
