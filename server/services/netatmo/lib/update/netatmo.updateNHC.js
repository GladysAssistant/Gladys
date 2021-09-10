const logger = require('../../../../utils/logger');
const { EVENTS } = require('../constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @example
 * updateNHC();
 */
async function updateNHC(key, device, deviceSelector) {
  // we save other home coach data
  try {
    const healthIndexValue = this.devices[key].dashboard_data.health_idx;
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${key}:health_idx`,
      state: healthIndexValue,
    });
  } catch (e) {
    logger.error(
      `Netatmo : File netatmo.updateNHC.js - Health Home Coach ${this.devices[key].station_name} - health index - error : ${e}`,
    );
  }
}

module.exports = {
  updateNHC,
};
