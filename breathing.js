/**
 * PLAČI - Breathing Mechanics
 * Implements the breath capacity system (inhale/exhale cycle)
 */

import { CONFIG } from "./config.js";
import { state } from "./state.js";

/**
 * Update breath capacity based on input volume (inhale)
 * Added guards to avoid NaN/Infinity from propagating into state.
 */
export function chargeBreathCapacity(inputVolume) {
  // Don't charge in debug mode
  if (state.debugModeActive) {
    state.breathCapacity = 0;
    return;
  }

  // Guard against invalid input values
  if (!isFinite(inputVolume) || inputVolume <= 0) return;

  if (state.breathCapacity < 1.0) {
    state.breathCapacity += inputVolume * CONFIG.breathing.chargeRate;
    state.breathCapacity = Math.min(1.0, state.breathCapacity);
  }
}

/**
 * Deplete breath capacity over time (exhale)
 * Added guards to ensure capacity remains a finite value.
 */
export function depleteBreathCapacity() {
  // Don't deplete in debug mode
  if (state.debugModeActive) {
    state.breathCapacity = 0;
    return;
  }

  // Ensure breathCapacity is a finite number before operating
  if (!isFinite(state.breathCapacity) || state.breathCapacity <= 0) {
    state.breathCapacity = 0;
    return;
  }

  if (state.breathCapacity > CONFIG.breathing.threshold) {
    state.breathCapacity -= CONFIG.breathing.depleteRate;
    state.breathCapacity = Math.max(0, state.breathCapacity);
  }
}

/**
 * Calculate output volume from breath capacity
 *
 * Normalize output to the 0..1 range so visuals and audio updates
 * receive a safe, consistent gain value. This prevents extremely large
 * numbers (e.g. when CONFIG.audio.maxVolume is large) from breaking
 * visual transforms or audio ramping.
 */
export function calculateOutputVolume() {
  // Debug mode override: low test volume to avoid distortion
  if (state.debugModeActive) {
    // Keep debug volume within normalized range
    return 0.15; // Fixed low volume for clean debug testing
  }

  // Guard against invalid breath capacity state
  if (!isFinite(state.breathCapacity) || state.breathCapacity <= 0) {
    return 0;
  }

  const capacityAboveThreshold = Math.max(
    0,
    state.breathCapacity - CONFIG.breathing.threshold,
  );

  // Only output if above threshold
  if (capacityAboveThreshold <= 0) {
    return 0;
  }

  // Normalize to 0..1 based on remaining capacity after threshold.
  // This makes the output suitable for both audio.gain (0..1) and visuals.
  const denom = Math.max(0.0001, 1 - CONFIG.breathing.threshold);
  let normalized = capacityAboveThreshold / denom;

  // Clamp to [0, 1] and ensure finite
  if (!isFinite(normalized)) normalized = 0;
  normalized = Math.min(1, Math.max(0, normalized));

  return normalized;
}
