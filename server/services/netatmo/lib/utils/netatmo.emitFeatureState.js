const { EVENTS } = require('../../../../utils/constants');
const { readValues } = require('../device/netatmo.deviceMapping');

/**
 * @description Emit a Gladys NEW_STATE event for a device feature, skipping absent values.
 * @param {object} gladys - Gladys instance.
 * @param {object} feature - Gladys device feature.
 * @param {any} value - Raw value coming from the Netatmo API.
 * @example emitFeatureState(this.gladys, feature, deviceNetatmo.temperature);
 */
function emitFeatureState(gladys, feature, value) {
  if (value === undefined || value === null) {
    return;
  }
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: feature.external_id,
    state: readValues[feature.category][feature.type](value),
  });
}

module.exports = {
  emitFeatureState,
};
