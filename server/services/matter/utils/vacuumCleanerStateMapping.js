const { VACUUM_CLEANER_STATE, VACUUM_CLEANER_MODE, VACUUM_CLEANER_CLEAN_MODE } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * Matter RvcOperationalState values (from Matter specification).
 * @see https://github.com/project-chip/connectedhomeip/blob/master/src/app/clusters/rvc-operational-state-server/rvc-operational-state-server.h
 */
const MATTER_RVC_OPERATIONAL_STATE = {
  STOPPED: 0,
  RUNNING: 1,
  PAUSED: 2,
  ERROR: 3,
  SEEKING_CHARGER: 64,
  CHARGING: 65,
  DOCKED: 66,
};

/**
 * Matter RvcRunMode values (from Matter specification).
 */
const MATTER_RVC_RUN_MODE = {
  IDLE: 0,
  CLEANING: 1,
  MAPPING: 2,
};

/**
 * Matter RvcCleanMode values (from Matter specification).
 * Standard modes are 0-3, manufacturer-specific modes start at 16384.
 */
const MATTER_RVC_CLEAN_MODE = {
  AUTO: 0,
  QUICK: 1,
  QUIET: 2,
  LOW_NOISE: 3,
  // Manufacturer-specific modes (16384+)
  DEEP_CLEAN: 16384,
  VACUUM: 16385,
  MOP: 16386,
};

/**
 * Matter Common ModeTag values (shared across mode clusters, from Matter specification).
 * Range: 0x0000-0x3FFF.
 */
const MATTER_COMMON_MODE_TAG = {
  AUTO: 0,
  QUICK: 1,
  QUIET: 2,
  LOW_NOISE: 3,
  LOW_ENERGY: 4,
  VACATION: 5,
  MIN: 6,
  MAX: 7,
  NIGHT: 8,
  DAY: 9,
};

/**
 * Matter RvcRunMode ModeTag values (from Matter specification).
 * These are used in the modeTags array of supportedModes to identify mode types.
 */
const MATTER_RVC_RUN_MODE_TAG = {
  IDLE: 16384, // 0x4000
  CLEANING: 16385, // 0x4001
  MAPPING: 16386, // 0x4002
};

/**
 * Matter RvcCleanMode ModeTag values (from Matter specification).
 * These are used in the modeTags array of supportedModes to identify mode types.
 */
const MATTER_RVC_CLEAN_MODE_TAG = {
  DEEP_CLEAN: 16384, // 0x4000
  VACUUM: 16385, // 0x4001
  MOP: 16386, // 0x4002
};

/**
 * @description Compute a score representing how well a mode's modeTags match a preference.
 * Returns 0 if there is no match (no primary tag present, or an exclude tag present).
 * Higher score = better match.
 * @param {Array} modeTags - The modeTags array of a Matter mode.
 * @param {object} preference - The preference object with primaryTags, excludeTags, preferTags arrays.
 * @returns {number} The match score (0 = no match).
 * @example
 * const score = scoreModeMatch([{ value: 16385 }], { primaryTags: [16385], excludeTags: [], preferTags: [] });
 */
function scoreModeMatch(modeTags, preference) {
  if (!modeTags || !Array.isArray(modeTags)) {
    return 0;
  }
  const tagValues = modeTags.map((t) => t.value);
  // Must have at least one primary tag
  const hasPrimary = preference.primaryTags.some((t) => tagValues.includes(t));
  if (!hasPrimary) {
    return 0;
  }
  // Must not have any exclude tag
  const hasExclude = preference.excludeTags.some((t) => tagValues.includes(t));
  if (hasExclude) {
    return 0;
  }
  // Specificity bonus: type-based preferences (manufacturer-specific tags >= 16384) are more
  // discriminative than intensity-based ones. This ensures e.g. mode "Vacuum: Quiet" maps to
  // Gladys VACUUM rather than QUIET when both could match.
  const specificityBonus = preference.primaryTags.every((t) => t >= 16384) ? 50 : 0;
  // Base score + bonus for each preferred tag present
  const preferBonus = preference.preferTags.filter((t) => tagValues.includes(t)).length * 10;
  return 100 + specificityBonus + preferBonus;
}

/**
 * @description Find the best Matter mode value matching a Gladys mode using preferences.
 * @param {Array} supportedModes - The supportedModes array from the cluster.
 * @param {number} gladysMode - The Gladys mode value to convert.
 * @param {Array} preferences - Array of preference objects (one per Gladys mode).
 * @returns {number|null} The best matching Matter mode value, or null if no match found.
 * @example
 * const matterMode = findMatterModeForGladys(supportedModes, gladysMode, preferences);
 */
function findMatterModeForGladys(supportedModes, gladysMode, preferences) {
  if (!supportedModes || !Array.isArray(supportedModes)) {
    return null;
  }
  const preference = preferences.find((p) => p.gladys === gladysMode);
  if (!preference) {
    return null;
  }
  let bestMode = null;
  let bestScore = 0;
  supportedModes.forEach((mode) => {
    const score = scoreModeMatch(mode.modeTags, preference);
    if (score > bestScore) {
      bestScore = score;
      bestMode = mode.mode;
    }
  });
  return bestMode;
}

/**
 * @description Find the best Gladys mode for a given Matter mode using preferences.
 * Preferences are tried in order (most specific first); ties are broken by preference order.
 * @param {Array} supportedModes - The supportedModes array from the cluster.
 * @param {number} matterModeValue - The Matter mode value to convert.
 * @param {Array} preferences - Array of preference objects (one per Gladys mode), most specific first.
 * @returns {number|null} The best matching Gladys mode value, or null if no match found.
 * @example
 * const gladysMode = findGladysModeForMatter(supportedModes, 5, GLADYS_CLEAN_MODE_PREFERENCES);
 */
function findGladysModeForMatter(supportedModes, matterModeValue, preferences) {
  if (!supportedModes || !Array.isArray(supportedModes)) {
    return null;
  }
  const matchingMode = supportedModes.find((m) => m.mode === matterModeValue);
  if (!matchingMode || !matchingMode.modeTags) {
    return null;
  }
  let bestGladys = null;
  let bestScore = 0;
  // Iterate in order: tiebreaker favors earlier (more specific) preferences
  preferences.forEach((preference) => {
    const score = scoreModeMatch(matchingMode.modeTags, preference);
    if (score > bestScore) {
      bestScore = score;
      bestGladys = preference.gladys;
    }
  });
  return bestGladys;
}

/**
 * @description Convert Matter RvcOperationalState to Gladys vacuum cleaner state.
 * @param {number} matterState - The Matter RvcOperationalState value.
 * @returns {number} The Gladys vacuum cleaner state.
 * @example
 * const gladysState = convertMatterOperationalStateToGladys(66); // Returns VACUUM_CLEANER_STATE.DOCKED (6)
 */
function convertMatterOperationalStateToGladys(matterState) {
  switch (matterState) {
    case MATTER_RVC_OPERATIONAL_STATE.STOPPED:
      return VACUUM_CLEANER_STATE.STOPPED;
    case MATTER_RVC_OPERATIONAL_STATE.RUNNING:
      return VACUUM_CLEANER_STATE.RUNNING;
    case MATTER_RVC_OPERATIONAL_STATE.PAUSED:
      return VACUUM_CLEANER_STATE.PAUSED;
    case MATTER_RVC_OPERATIONAL_STATE.ERROR:
      return VACUUM_CLEANER_STATE.ERROR;
    case MATTER_RVC_OPERATIONAL_STATE.SEEKING_CHARGER:
      return VACUUM_CLEANER_STATE.RETURNING_TO_DOCK;
    case MATTER_RVC_OPERATIONAL_STATE.CHARGING:
      return VACUUM_CLEANER_STATE.CHARGING;
    case MATTER_RVC_OPERATIONAL_STATE.DOCKED:
      return VACUUM_CLEANER_STATE.DOCKED;
    default:
      return matterState;
  }
}

/**
 * @description Convert Gladys vacuum cleaner state to Matter RvcOperationalState.
 * @param {number} gladysState - The Gladys vacuum cleaner state.
 * @returns {number} The Matter RvcOperationalState value.
 * @example
 * const matterState = convertGladysOperationalStateToMatter(6); // Returns MATTER_RVC_OPERATIONAL_STATE.DOCKED (66)
 */
function convertGladysOperationalStateToMatter(gladysState) {
  switch (gladysState) {
    case VACUUM_CLEANER_STATE.STOPPED:
      return MATTER_RVC_OPERATIONAL_STATE.STOPPED;
    case VACUUM_CLEANER_STATE.RUNNING:
      return MATTER_RVC_OPERATIONAL_STATE.RUNNING;
    case VACUUM_CLEANER_STATE.PAUSED:
      return MATTER_RVC_OPERATIONAL_STATE.PAUSED;
    case VACUUM_CLEANER_STATE.ERROR:
      return MATTER_RVC_OPERATIONAL_STATE.ERROR;
    case VACUUM_CLEANER_STATE.RETURNING_TO_DOCK:
      return MATTER_RVC_OPERATIONAL_STATE.SEEKING_CHARGER;
    case VACUUM_CLEANER_STATE.CHARGING:
      return MATTER_RVC_OPERATIONAL_STATE.CHARGING;
    case VACUUM_CLEANER_STATE.DOCKED:
      return MATTER_RVC_OPERATIONAL_STATE.DOCKED;
    default:
      return gladysState;
  }
}

/**
 * Preferences for converting between Gladys VACUUM_CLEANER_MODE and Matter RvcRunMode.
 * Order matters: most specific preferences first (used as tiebreaker).
 * Each entry describes how to find the best Matter mode for a Gladys mode and vice versa.
 */
const GLADYS_RUN_MODE_PREFERENCES = [
  {
    gladys: VACUUM_CLEANER_MODE.IDLE,
    primaryTags: [MATTER_RVC_RUN_MODE_TAG.IDLE],
    excludeTags: [],
    preferTags: [],
  },
  {
    gladys: VACUUM_CLEANER_MODE.CLEANING,
    primaryTags: [MATTER_RVC_RUN_MODE_TAG.CLEANING],
    excludeTags: [],
    preferTags: [],
  },
  {
    gladys: VACUUM_CLEANER_MODE.MAPPING,
    primaryTags: [MATTER_RVC_RUN_MODE_TAG.MAPPING],
    excludeTags: [],
    preferTags: [],
  },
];

/**
 * @description Convert Matter RvcRunMode to Gladys vacuum cleaner mode.
 * Uses dynamic supportedModes if available, otherwise falls back to static mapping.
 * @param {number} matterMode - The Matter RvcRunMode value.
 * @param {object} supportedModesData - Optional object containing supportedModes array.
 * @returns {number} The Gladys vacuum cleaner mode.
 * @example
 * const gladysMode = convertMatterRunModeToGladys(1); // Returns VACUUM_CLEANER_MODE.CLEANING (1)
 */
function convertMatterRunModeToGladys(matterMode, supportedModesData = null) {
  // Try dynamic mapping using supportedModes
  if (supportedModesData && supportedModesData.supportedModes) {
    const gladysMode = findGladysModeForMatter(
      supportedModesData.supportedModes,
      matterMode,
      GLADYS_RUN_MODE_PREFERENCES,
    );
    if (gladysMode !== null) {
      return gladysMode;
    }
    logger.debug(`Matter: No ModeTag mapping found for RvcRunMode value ${matterMode}, using fallback`);
  }

  // Fallback to static mapping (Matter spec default values)
  switch (matterMode) {
    case MATTER_RVC_RUN_MODE.IDLE:
      return VACUUM_CLEANER_MODE.IDLE;
    case MATTER_RVC_RUN_MODE.CLEANING:
      return VACUUM_CLEANER_MODE.CLEANING;
    case MATTER_RVC_RUN_MODE.MAPPING:
      return VACUUM_CLEANER_MODE.MAPPING;
    default:
      return matterMode;
  }
}

/**
 * @description Convert Gladys vacuum cleaner mode to Matter RvcRunMode.
 * Uses dynamic supportedModes if available, otherwise falls back to static mapping.
 * @param {number} gladysMode - The Gladys vacuum cleaner mode.
 * @param {object} supportedModesData - Optional object containing supportedModes array.
 * @returns {number} The Matter RvcRunMode value.
 * @example
 * const matterMode = convertGladysRunModeToMatter(1); // Returns MATTER_RVC_RUN_MODE.CLEANING (1)
 */
function convertGladysRunModeToMatter(gladysMode, supportedModesData = null) {
  // Try dynamic mapping using supportedModes
  if (supportedModesData && supportedModesData.supportedModes) {
    const matterMode = findMatterModeForGladys(
      supportedModesData.supportedModes,
      gladysMode,
      GLADYS_RUN_MODE_PREFERENCES,
    );
    if (matterMode !== null) {
      logger.debug(`Matter: Converted Gladys mode ${gladysMode} to Matter mode ${matterMode} using supportedModes`);
      return matterMode;
    }
    logger.debug(`Matter: No supportedModes mapping found for Gladys mode ${gladysMode}, using fallback`);
  }

  // Fallback to static mapping (Matter spec default values)
  switch (gladysMode) {
    case VACUUM_CLEANER_MODE.IDLE:
      return MATTER_RVC_RUN_MODE.IDLE;
    case VACUUM_CLEANER_MODE.CLEANING:
      return MATTER_RVC_RUN_MODE.CLEANING;
    case VACUUM_CLEANER_MODE.MAPPING:
      return MATTER_RVC_RUN_MODE.MAPPING;
    default:
      return gladysMode;
  }
}

/**
 * Preferences for converting between Gladys VACUUM_CLEANER_CLEAN_MODE and Matter RvcCleanMode.
 * Order matters: most specific preferences first (type-based modes before intensity-based modes).
 * For Matter→Gladys, the first matching preference wins ties.
 * For Gladys→Matter, the highest score wins (more preferTags = more specific match).
 *
 * Type-based modes (DEEP_CLEAN, VACUUM, MOP) target manufacturer-specific tags 16384-16386.
 * Intensity-based modes (AUTO, QUICK, QUIET, LOW_NOISE) target Common ModeTags 0-4 and prefer
 * dual-purpose modes (Vacuum & Mop) when available.
 */
const GLADYS_CLEAN_MODE_PREFERENCES = [
  // Type-based: most specific first (so they win ties for Matter→Gladys)
  {
    gladys: VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN,
    primaryTags: [MATTER_RVC_CLEAN_MODE_TAG.DEEP_CLEAN],
    excludeTags: [],
    preferTags: [],
  },
  {
    gladys: VACUUM_CLEANER_CLEAN_MODE.VACUUM,
    primaryTags: [MATTER_RVC_CLEAN_MODE_TAG.VACUUM],
    excludeTags: [MATTER_RVC_CLEAN_MODE_TAG.MOP],
    preferTags: [MATTER_COMMON_MODE_TAG.AUTO],
  },
  {
    gladys: VACUUM_CLEANER_CLEAN_MODE.MOP,
    primaryTags: [MATTER_RVC_CLEAN_MODE_TAG.MOP],
    excludeTags: [MATTER_RVC_CLEAN_MODE_TAG.VACUUM],
    preferTags: [MATTER_COMMON_MODE_TAG.AUTO],
  },
  // Intensity-based: prefer dual-purpose (Vacuum & Mop) modes
  {
    gladys: VACUUM_CLEANER_CLEAN_MODE.AUTO,
    primaryTags: [MATTER_COMMON_MODE_TAG.AUTO],
    excludeTags: [],
    preferTags: [MATTER_RVC_CLEAN_MODE_TAG.VACUUM, MATTER_RVC_CLEAN_MODE_TAG.MOP],
  },
  {
    gladys: VACUUM_CLEANER_CLEAN_MODE.QUICK,
    primaryTags: [MATTER_COMMON_MODE_TAG.QUICK],
    excludeTags: [],
    preferTags: [MATTER_RVC_CLEAN_MODE_TAG.VACUUM, MATTER_RVC_CLEAN_MODE_TAG.MOP],
  },
  {
    gladys: VACUUM_CLEANER_CLEAN_MODE.QUIET,
    primaryTags: [MATTER_COMMON_MODE_TAG.QUIET],
    excludeTags: [],
    preferTags: [MATTER_RVC_CLEAN_MODE_TAG.VACUUM, MATTER_RVC_CLEAN_MODE_TAG.MOP],
  },
  {
    // Gladys LOW_NOISE accepts both Matter LowNoise (3) and LowEnergy (4) tags,
    // since Roborock and similar manufacturers use LowEnergy for energy-saving modes.
    gladys: VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE,
    primaryTags: [MATTER_COMMON_MODE_TAG.LOW_NOISE, MATTER_COMMON_MODE_TAG.LOW_ENERGY],
    excludeTags: [],
    preferTags: [MATTER_RVC_CLEAN_MODE_TAG.VACUUM, MATTER_RVC_CLEAN_MODE_TAG.MOP],
  },
];

/**
 * @description Convert Matter RvcCleanMode to Gladys vacuum cleaner clean mode.
 * Uses dynamic supportedModes if available, otherwise falls back to static mapping.
 * @param {number} matterMode - The Matter RvcCleanMode value.
 * @param {object} supportedModesData - Optional object containing supportedModes array.
 * @returns {number|null} The Gladys vacuum cleaner clean mode, or null if unknown.
 * @example
 * const gladysMode = convertMatterCleanModeToGladys(0); // Returns VACUUM_CLEANER_CLEAN_MODE.AUTO (0)
 */
function convertMatterCleanModeToGladys(matterMode, supportedModesData = null) {
  // Try dynamic mapping using supportedModes
  if (supportedModesData && supportedModesData.supportedModes) {
    const gladysMode = findGladysModeForMatter(
      supportedModesData.supportedModes,
      matterMode,
      GLADYS_CLEAN_MODE_PREFERENCES,
    );
    if (gladysMode !== null) {
      return gladysMode;
    }
    logger.debug(`Matter: No ModeTag mapping found for RvcCleanMode value ${matterMode}, using fallback`);
  }

  // Fallback to static mapping (Matter spec default values)
  switch (matterMode) {
    case MATTER_RVC_CLEAN_MODE.AUTO:
      return VACUUM_CLEANER_CLEAN_MODE.AUTO;
    case MATTER_RVC_CLEAN_MODE.QUICK:
      return VACUUM_CLEANER_CLEAN_MODE.QUICK;
    case MATTER_RVC_CLEAN_MODE.QUIET:
      return VACUUM_CLEANER_CLEAN_MODE.QUIET;
    case MATTER_RVC_CLEAN_MODE.LOW_NOISE:
      return VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE;
    case MATTER_RVC_CLEAN_MODE.DEEP_CLEAN:
      return VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN;
    case MATTER_RVC_CLEAN_MODE.VACUUM:
      return VACUUM_CLEANER_CLEAN_MODE.VACUUM;
    case MATTER_RVC_CLEAN_MODE.MOP:
      return VACUUM_CLEANER_CLEAN_MODE.MOP;
    default:
      logger.debug(`Matter: Unknown RvcCleanMode value ${matterMode}, returning as-is`);
      return matterMode;
  }
}

/**
 * @description Convert Gladys vacuum cleaner clean mode to Matter RvcCleanMode.
 * Uses dynamic supportedModes if available, otherwise falls back to static mapping.
 * @param {number} gladysMode - The Gladys vacuum cleaner clean mode.
 * @param {object} supportedModesData - Optional object containing supportedModes array.
 * @returns {number} The Matter RvcCleanMode value.
 * @example
 * const matterMode = convertGladysCleanModeToMatter(4); // Returns MATTER_RVC_CLEAN_MODE.DEEP_CLEAN (16384)
 */
function convertGladysCleanModeToMatter(gladysMode, supportedModesData = null) {
  // Try dynamic mapping using supportedModes
  if (supportedModesData && supportedModesData.supportedModes) {
    const matterMode = findMatterModeForGladys(
      supportedModesData.supportedModes,
      gladysMode,
      GLADYS_CLEAN_MODE_PREFERENCES,
    );
    if (matterMode !== null) {
      logger.debug(
        `Matter: Converted Gladys clean mode ${gladysMode} to Matter mode ${matterMode} using supportedModes`,
      );
      return matterMode;
    }
    logger.debug(`Matter: No supportedModes mapping found for Gladys clean mode ${gladysMode}, using fallback`);
  }

  // Fallback to static mapping (Matter spec default values)
  switch (gladysMode) {
    case VACUUM_CLEANER_CLEAN_MODE.AUTO:
      return MATTER_RVC_CLEAN_MODE.AUTO;
    case VACUUM_CLEANER_CLEAN_MODE.QUICK:
      return MATTER_RVC_CLEAN_MODE.QUICK;
    case VACUUM_CLEANER_CLEAN_MODE.QUIET:
      return MATTER_RVC_CLEAN_MODE.QUIET;
    case VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE:
      return MATTER_RVC_CLEAN_MODE.LOW_NOISE;
    case VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN:
      return MATTER_RVC_CLEAN_MODE.DEEP_CLEAN;
    case VACUUM_CLEANER_CLEAN_MODE.VACUUM:
      return MATTER_RVC_CLEAN_MODE.VACUUM;
    case VACUUM_CLEANER_CLEAN_MODE.MOP:
      return MATTER_RVC_CLEAN_MODE.MOP;
    default:
      logger.debug(`Matter: Unknown Gladys clean mode value ${gladysMode}, returning as-is`);
      return gladysMode;
  }
}

module.exports = {
  MATTER_RVC_OPERATIONAL_STATE,
  MATTER_RVC_RUN_MODE,
  MATTER_RVC_CLEAN_MODE,
  convertMatterOperationalStateToGladys,
  convertGladysOperationalStateToMatter,
  convertMatterRunModeToGladys,
  convertGladysRunModeToMatter,
  convertMatterCleanModeToGladys,
  convertGladysCleanModeToMatter,
};
