export const DEFAULT_SIGNAL_MIN = 0;
export const DEFAULT_SIGNAL_MAX = 100;

/**
 * @description Map a signal strength value to a 0-5 bar level.
 * @param {number} value - Signal strength value.
 * @param {number} [min] - Minimum value of the feature.
 * @param {number} [max] - Maximum value of the feature.
 * @returns {number} Signal quality level from 0 (off) to 5.
 */
export const getSignalQualityLevel = (value, min = DEFAULT_SIGNAL_MIN, max = DEFAULT_SIGNAL_MAX) => {
  if (value == null) {
    return null;
  }
  if (max === min) {
    return value > min ? 5 : 0;
  }
  const ratio = Math.round(((value - min) * 5) / (max - min));
  return Math.max(0, Math.min(5, ratio));
};

/**
 * @description Get the Tabler icon name for a signal quality level.
 * @param {number|null} level - Signal quality level from 0 to 5.
 * @returns {string|null} Tabler icon name.
 */
export const getSignalQualityIcon = level => {
  if (level == null) {
    return null;
  }
  return `tabler-antenna-bars-${level || 'off'}`;
};
