const { EVENTS, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/netatmo.deviceMapping');
const { SUPPORTED_MODULE_TYPE } = require('./utils/netatmo.constants');

/**
 *
 * @description Poll values of an Netatmo device.
 * @param {object} netatmoHandler - Of nothing.
 * @param {object} deviceGladys - Of nothing.
 * @param {object} deviceNetatmo - Of nothing.
 * @param {string} externalId - Of nothing.
 * @returns {Promise} Promise of nothing.
 * @example
 * updateValues(netatmoHandler, deviceGladys, deviceNetatmo, externalId);
 */
async function updateValues(netatmoHandler, deviceGladys, deviceNetatmo, externalId) {
  const [prefix, topic] = externalId.split(':');
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no id and category indicator`);
  }
  const { setpoint, measured, room } = deviceNetatmo;
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  deviceGladys.features.forEach((deviceFeature) => {
    const externalIdFeature = deviceFeature.external_id.split(':');
    const featureName = externalIdFeature[externalIdFeature.length - 1];
    let value;
    if (typeof deviceNetatmo[featureName] !== 'undefined') {
      value = deviceNetatmo[featureName];
    } else if (setpoint && typeof setpoint[featureName] !== 'undefined') {
      value = setpoint[featureName];
    } else if (measured && typeof measured[featureName] !== 'undefined') {
      value = measured[featureName];
    } else if (room && typeof room[featureName] !== 'undefined') {
      value = room[featureName];
    }

    switch (deviceNetatmo.type) {
      case SUPPORTED_MODULE_TYPE.PLUG: {
        if (featureName === 'plug_connected_boiler' && typeof value === 'undefined') {
          value = false;
        }
        break;
      }
      default:
        break;
    }

    if (typeof value !== 'undefined') {
      const transformedValue = readValues[deviceFeature.category][deviceFeature.type](value);
      if (
        (deviceFeature.last_value !== transformedValue || new Date(deviceFeature.last_value_changed) < tenMinutesAgo) &&
        deviceFeature.type !== DEVICE_FEATURE_TYPES.THERMOSTAT.TEXT
      ) {
        if (transformedValue !== null && transformedValue !== undefined && !Number.isNaN(transformedValue)) {
          netatmoHandler.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: deviceFeature.external_id,
            state: transformedValue,
          });
        }
      }
    } else {
      logger.error(
        'deviceGladys: ',
        deviceGladys.name,
        'deviceFeature.category: ',
        deviceFeature.category,
        'deviceFeature.type: ',
        deviceFeature.type,
        'featureName: ',
        featureName,
        ' not found in the root of the Netatmo device nor in the other properties',
      );
    }
  });
}

module.exports = {
  updateValues,
};
