const logger = require('../../../utils/logger');
const { RUNTIME_SUFFIXES } = require('./thermostat.setVariable');

// Runtime state kept per thermostat feature, outside the device row. Shared with
// the write path so a suffix added there is cleaned up here too.
const VARIABLE_SUFFIXES = RUNTIME_SUFFIXES;

/**
 * @description Called after a thermostat device is deleted: drop the runtime
 * variables attached to its features. Without this they linger in the variable
 * table forever and a device recreated with the same selector would inherit a
 * stale preset or a manual override.
 * @param {object} device - The deleted device.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.postDelete(device);
 */
async function postDelete(device) {
  this.invalidateWindowCache();
  const features = (device && device.features) || [];
  await Promise.all(
    features.map(async (feature) => {
      const featureKey = feature.selector.toUpperCase().replace(/-/g, '_');
      const keys = VARIABLE_SUFFIXES.map((suffix) => `THERMOSTAT_${featureKey}_${suffix}`);
      await Promise.all(
        keys.map(async (key) => {
          try {
            await this.gladys.variable.destroy(key, this.serviceId);
          } catch (e) {
            logger.debug(`Thermostat: could not remove variable ${key}: ${e.message}`);
          }
        }),
      );
    }),
  );
}

module.exports = { postDelete, VARIABLE_SUFFIXES };
