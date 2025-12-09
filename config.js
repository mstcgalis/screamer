/**
 * PLAČI - Configuration
 * All application constants and configuration values
 */

export const CONFIG = {
  frequency: {
    min: 100,
    max: 1000,
    default: 550,
  },
  breathing: {
    chargeRate: 0.03,
    depleteRate: 0.015,
    threshold: 0.2,
  },
  audio: {
    maxVolume: 100.0, // Maximum output volume with compression protection
    micSensitivity: 15,
    smoothingTime: 0.8,
    fftSize: 256,
    vibrato: 3,
    filterQ: 1.0,
  },
  visual: {
    hueRange: 280,
    backgroundHue: 45,
    transitionTime: 0.05,
  },
  debug: {
    enabled: false,
  },
};
