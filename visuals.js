/**
 * PLAČI - Visual Feedback System
 * Handles all visual updates (background color, circle color/size/opacity)
 */

import { CONFIG } from "./config.js";
import { state } from "./state.js";

/**
 * DOM element references
 */
export const dom = {
  // Guard against running in non-DOM environments (SSR / tests)
  body: typeof document !== "undefined" ? document.body : null,
  circle:
    typeof document !== "undefined" && document.getElementById
      ? document.getElementById("circle")
      : null,
  container:
    typeof document !== "undefined" && document.getElementById
      ? document.getElementById("container")
      : null,
  topText:
    typeof document !== "undefined" && document.getElementById
      ? document.getElementById("topText")
      : null,
  capacityIndicator:
    typeof document !== "undefined" && document.getElementById
      ? document.getElementById("capacityIndicator")
      : null,
};

/**
 * Map frequency to hue value (0-280 degrees)
 */
function frequencyToHue(frequency) {
  // Ensure the frequency range is valid and avoid division by zero
  const minF = Number(CONFIG.frequency.min) || 0;
  const maxF = Number(CONFIG.frequency.max) || minF + 1;
  const range = maxF - minF;
  const clamped = Math.max(minF, Math.min(maxF, Number(frequency) || minF));

  let normalized = range > 0 ? (clamped - minF) / range : 0;
  // Clamp normalized value to [0,1]
  normalized = Math.max(0, Math.min(1, normalized));

  return normalized * (Number(CONFIG.visual.hueRange) || 0);
}

/**
 * Update background color based on input volume
 */
function updateBackgroundColor(inputVolume) {
  if (!dom.body) return;

  // Normalize and clamp inputVolume to [0,1]
  let v = Number(inputVolume) || 0;
  v = Math.max(0, Math.min(1, v));

  const saturation = Math.round(v * 100);
  const lightness = Math.round(95 - v * 25);
  const hue = Number(CONFIG.visual.backgroundHue) || 0;

  dom.body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Update circle color based on frequency (X-axis) and filter cutoff (Y-axis)
 */
function updateCircleColor(frequency) {
  if (!dom.circle) return;

  // Map frequency -> hue using safe helper
  const hueVal = frequencyToHue(frequency);
  const hue = Math.round(hueVal);

  // Ensure touchY is valid and clamp to [0,1]
  let y = Number(state.touchY) || 0;
  y = Math.max(0, Math.min(1, y));

  // Y-axis: Filter cutoff (touchY) → Saturation & Lightness
  const saturation = Math.round(40 + y * 50); // 40-90%
  const lightness = Math.round(70 - y * 20); // 70-50%

  dom.circle.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Update circle size and opacity based on output volume
 */
function updateCircleTransform(outputVolume) {
  if (!dom.circle) return;

  // Normalize and clamp outputVolume to [0,1] so transforms remain reasonable
  let v = Number(outputVolume) || 0;
  v = Math.max(0, Math.min(1, v));

  const scale = (0.8 + v * 0.4).toFixed(3);
  const opacity = Math.max(0, Math.min(1, 0.3 + v * 0.7)).toFixed(3);

  dom.circle.style.transform = `scale(${scale})`;
  dom.circle.style.opacity = `${opacity}`;
}

/**
 * Update text based on whether sound is being output
 */
function updateText(outputVolume) {
  if (!dom.topText) return;

  // Use normalized threshold check (tolerant for different scales)
  const v = Number(outputVolume) || 0;
  dom.topText.textContent = v > 0 ? "LISTEN" : "SCREAM";
}

/**
 * Update breath capacity visualization
 */
function updateCapacityIndicator(breathCapacity) {
  if (!dom.capacityIndicator) return;

  // Normalize and clamp breathCapacity
  let c = Number(breathCapacity) || 0;
  c = Math.max(0, Math.min(1, c));

  // Convert capacity (0-1) to angle (0-360 degrees)
  const angle = Math.round(c * 360);
  dom.capacityIndicator.style.setProperty("--capacity-angle", `${angle}deg`);
}

/**
 * Update all visual elements
 */
export function updateVisuals() {
  updateBackgroundColor(state.inputVolume);
  updateCircleColor(state.currentFrequency);
  updateCircleTransform(state.outputVolume);
  updateText(state.outputVolume);
  updateCapacityIndicator(state.breathCapacity);
}
