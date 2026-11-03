const logger = require('../../../utils/logger');
const { VARIABLES, EXPOSURE_MODES } = require('./constants');

/**
 * @description Read the exposure setting: the mode, and the selectors the user picked.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - Service id.
 * @returns {Promise<object>} Resolves with { exposureMode, exposedDevices }.
 * @example
 * const { exposureMode, exposedDevices } = await readExposure(gladys, serviceId);
 */
async function readExposure(gladys, serviceId) {
  const mode = await gladys.variable.getValue(VARIABLES.EXPOSURE_MODE, serviceId);
  const exposureMode = mode === EXPOSURE_MODES.SELECTION ? EXPOSURE_MODES.SELECTION : EXPOSURE_MODES.ALL;
  const raw = await gladys.variable.getValue(VARIABLES.EXPOSED_DEVICES, serviceId);
  let exposedDevices = [];
  try {
    exposedDevices = JSON.parse(raw || '[]');
  } catch (e) {
    logger.warn(`Matter bridge: unable to parse ${VARIABLES.EXPOSED_DEVICES}`);
  }
  // A broken selection exposes nothing rather than everything: devices the user took out of
  // Matter must not come back silently. An empty bridge is visible and recoverable.
  if (!Array.isArray(exposedDevices)) {
    exposedDevices = [];
  }
  return { exposureMode, exposedDevices };
}

/**
 * @description Tell if a device must be on the bridge, given the exposure setting.
 * @param {object} device - Gladys device.
 * @param {object} exposure - Exposure setting, from readExposure.
 * @returns {boolean} True when the device is exposed.
 * @example
 * isExposed(device, exposure);
 */
function isExposed(device, exposure) {
  return exposure.exposureMode === EXPOSURE_MODES.ALL || exposure.exposedDevices.includes(device.selector);
}

module.exports = {
  readExposure,
  isExposed,
};
