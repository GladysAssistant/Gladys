const { EVENTS } = require('../../../utils/constants');

/**
 * @description Emit a temperature state in Gladys format.
 * @param {object} gladysEvent - Gladys event emitter.
 * @param {string} deviceFeatureExternalId - The device feature external ID.
 * @param {number|null|undefined} value - The temperature value in Matter format (hundredths of a degree).
 * @example emitTemperatureState(gladys.event, 'matter:1:4:1026', 5220);
 */
function emitTemperatureState(gladysEvent, deviceFeatureExternalId, value) {
  if (value === null || value === undefined) {
    return;
  }

  gladysEvent.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: deviceFeatureExternalId,
    state: value / 100,
  });
}

/**
 * @description Read initial temperature and emit state.
 * @param {Function} getValue - Async function to get the temperature value.
 * @param {object} gladysEvent - Gladys event emitter.
 * @param {string} deviceFeatureExternalId - The device feature external ID.
 * @param {object} matterLogger - Logger instance.
 * @param {string} logContext - Context for log messages.
 * @example
 * await readAndEmitInitialTemperature(
 *   () => clusterClient.getMeasuredValueAttribute(),
 *   gladys.event,
 *   'matter:1:4:1026',
 *   logger,
 *   'TemperatureMeasurement value',
 * );
 */
async function readAndEmitInitialTemperature(getValue, gladysEvent, deviceFeatureExternalId, matterLogger, logContext) {
  try {
    const value = await getValue();
    if (value === null || value === undefined) {
      matterLogger.info(`Matter: Initial ${logContext} is empty for ${deviceFeatureExternalId}`);
      return;
    }
    emitTemperatureState(gladysEvent, deviceFeatureExternalId, value);
    matterLogger.info(`Matter: Initial ${logContext} for ${deviceFeatureExternalId}: ${value / 100}°C`);
  } catch (error) {
    matterLogger.warn(`Matter: Failed to read initial ${logContext} for ${deviceFeatureExternalId}: ${error.message}`);
  }
}

module.exports = {
  emitTemperatureState,
  readAndEmitInitialTemperature,
};
