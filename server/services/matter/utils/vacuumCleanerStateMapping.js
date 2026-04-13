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
 * @description Find the Matter mode value for a given Gladys mode using supportedModes.
 * @param {Array} supportedModes - The supportedModes array from the cluster.
 * @param {number} targetModeTag - The ModeTag to search for.
 * @returns {number|null} The Matter mode value, or null if not found.
 * @example
 * const matterMode = findMatterModeByTag(supportedModes, 16384); // Returns mode value for Idle tag
 */
function findMatterModeByTag(supportedModes, targetModeTag) {
  if (!supportedModes || !Array.isArray(supportedModes)) {
    return null;
  }
  const foundMode = supportedModes.find(
    (mode) => mode.modeTags && Array.isArray(mode.modeTags) && mode.modeTags.some((tag) => tag.value === targetModeTag),
  );
  return foundMode ? foundMode.mode : null;
}

/**
 * @description Find the Gladys mode for a given Matter mode value using supportedModes.
 * @param {Array} supportedModes - The supportedModes array from the cluster.
 * @param {number} matterModeValue - The Matter mode value to convert.
 * @param {object} modeTagMapping - Mapping of ModeTag values to Gladys mode values.
 * @returns {number|null} The Gladys mode value, or null if not found.
 * @example
 * const gladysMode = findGladysModeByMatterValue(supportedModes, 1, tagMapping); // Returns Gladys mode
 */
function findGladysModeByMatterValue(supportedModes, matterModeValue, modeTagMapping) {
  if (!supportedModes || !Array.isArray(supportedModes)) {
    return null;
  }
  const matchingMode = supportedModes.find(
    (mode) => mode.mode === matterModeValue && mode.modeTags && Array.isArray(mode.modeTags),
  );
  if (!matchingMode) {
    return null;
  }
  const matchingTag = matchingMode.modeTags.find((tag) => modeTagMapping[tag.value] !== undefined);
  return matchingTag ? modeTagMapping[matchingTag.value] : null;
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
 * Mapping of RvcRunMode ModeTag values to Gladys VACUUM_CLEANER_MODE values.
 */
const RVC_RUN_MODE_TAG_TO_GLADYS = {
  [MATTER_RVC_RUN_MODE_TAG.IDLE]: VACUUM_CLEANER_MODE.IDLE,
  [MATTER_RVC_RUN_MODE_TAG.CLEANING]: VACUUM_CLEANER_MODE.CLEANING,
  [MATTER_RVC_RUN_MODE_TAG.MAPPING]: VACUUM_CLEANER_MODE.MAPPING,
};

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
    const gladysMode = findGladysModeByMatterValue(
      supportedModesData.supportedModes,
      matterMode,
      RVC_RUN_MODE_TAG_TO_GLADYS,
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
 * Mapping of Gladys VACUUM_CLEANER_MODE values to RvcRunMode ModeTag values.
 */
const GLADYS_TO_RVC_RUN_MODE_TAG = {
  [VACUUM_CLEANER_MODE.IDLE]: MATTER_RVC_RUN_MODE_TAG.IDLE,
  [VACUUM_CLEANER_MODE.CLEANING]: MATTER_RVC_RUN_MODE_TAG.CLEANING,
  [VACUUM_CLEANER_MODE.MAPPING]: MATTER_RVC_RUN_MODE_TAG.MAPPING,
};

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
    const targetModeTag = GLADYS_TO_RVC_RUN_MODE_TAG[gladysMode];
    if (targetModeTag !== undefined) {
      const matterMode = findMatterModeByTag(supportedModesData.supportedModes, targetModeTag);
      if (matterMode !== null) {
        logger.debug(`Matter: Converted Gladys mode ${gladysMode} to Matter mode ${matterMode} using supportedModes`);
        return matterMode;
      }
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
 * Mapping of RvcCleanMode ModeTag values to Gladys VACUUM_CLEANER_CLEAN_MODE values.
 */
const RVC_CLEAN_MODE_TAG_TO_GLADYS = {
  [MATTER_RVC_CLEAN_MODE_TAG.DEEP_CLEAN]: VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN,
  [MATTER_RVC_CLEAN_MODE_TAG.VACUUM]: VACUUM_CLEANER_CLEAN_MODE.VACUUM,
  [MATTER_RVC_CLEAN_MODE_TAG.MOP]: VACUUM_CLEANER_CLEAN_MODE.MOP,
};

/**
 * Mapping of Gladys VACUUM_CLEANER_CLEAN_MODE values to RvcCleanMode ModeTag values.
 */
const GLADYS_TO_RVC_CLEAN_MODE_TAG = {
  [VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN]: MATTER_RVC_CLEAN_MODE_TAG.DEEP_CLEAN,
  [VACUUM_CLEANER_CLEAN_MODE.VACUUM]: MATTER_RVC_CLEAN_MODE_TAG.VACUUM,
  [VACUUM_CLEANER_CLEAN_MODE.MOP]: MATTER_RVC_CLEAN_MODE_TAG.MOP,
};

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
    const gladysMode = findGladysModeByMatterValue(
      supportedModesData.supportedModes,
      matterMode,
      RVC_CLEAN_MODE_TAG_TO_GLADYS,
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
    const targetModeTag = GLADYS_TO_RVC_CLEAN_MODE_TAG[gladysMode];
    if (targetModeTag !== undefined) {
      const matterMode = findMatterModeByTag(supportedModesData.supportedModes, targetModeTag);
      if (matterMode !== null) {
        logger.debug(
          `Matter: Converted Gladys clean mode ${gladysMode} to Matter mode ${matterMode} using supportedModes`,
        );
        return matterMode;
      }
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
