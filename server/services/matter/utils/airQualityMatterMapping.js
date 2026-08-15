const { AIR_QUALITY_LEVEL } = require('../../../utils/constants');

const AIR_QUALITY_LEVEL_LABELS = {
  [AIR_QUALITY_LEVEL.UNKNOWN]: 'Unknown',
  [AIR_QUALITY_LEVEL.GOOD]: 'Good',
  [AIR_QUALITY_LEVEL.FAIR]: 'Fair',
  [AIR_QUALITY_LEVEL.MODERATE]: 'Moderate',
  [AIR_QUALITY_LEVEL.POOR]: 'Poor',
  [AIR_QUALITY_LEVEL.VERY_POOR]: 'Very poor',
  [AIR_QUALITY_LEVEL.EXTREMELY_POOR]: 'Extremely poor',
};

// Matter AirQuality cluster: Unknown, Good and Poor are always part of the AirQualityEnum, the
// four other levels are each behind an optional cluster feature (Matter spec 2.9.5).
const OPTIONAL_AIR_QUALITY_LEVEL_FEATURES = {
  fair: AIR_QUALITY_LEVEL.FAIR,
  moderate: AIR_QUALITY_LEVEL.MODERATE,
  veryPoor: AIR_QUALITY_LEVEL.VERY_POOR,
  extremelyPoor: AIR_QUALITY_LEVEL.EXTREMELY_POOR,
};

const MANDATORY_AIR_QUALITY_LEVELS = [AIR_QUALITY_LEVEL.UNKNOWN, AIR_QUALITY_LEVEL.GOOD, AIR_QUALITY_LEVEL.POOR];

/**
 * @description Build the supported_options list of the air quality level feature
 * from the AirQuality cluster supported features.
 * @param {object} supportedFeatures - AirQuality cluster supported features (fair/moderate/veryPoor/extremelyPoor).
 * @returns {Array} Supported options ({ value, label }) sorted by AIR_QUALITY_LEVEL value.
 * @example
 * const supportedOptions = getAirQualityLevelSupportedOptions({ fair: true, moderate: true });
 */
function getAirQualityLevelSupportedOptions(supportedFeatures) {
  const levels = [...MANDATORY_AIR_QUALITY_LEVELS];
  Object.keys(OPTIONAL_AIR_QUALITY_LEVEL_FEATURES).forEach((featureName) => {
    if (supportedFeatures && supportedFeatures[featureName]) {
      levels.push(OPTIONAL_AIR_QUALITY_LEVEL_FEATURES[featureName]);
    }
  });
  return levels
    .sort((a, b) => a - b)
    .map((level) => ({
      value: level,
      label: AIR_QUALITY_LEVEL_LABELS[level],
    }));
}

module.exports = {
  AIR_QUALITY_LEVEL_LABELS,
  getAirQualityLevelSupportedOptions,
};
