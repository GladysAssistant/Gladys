const logger = require('../../../../utils/logger');
const { bindValue } = require('../utils/overkiz.bindValue');
const { DEVICE_COMMANDS, DEVICE_STATES } = require('../utils/overkiz.constants');
const { getNodeStateInfoByExternalId } = require('../utils/overkiz.externalId');
const { sendCommand } = require('./overkiz.sendCommand');

/**
 * @description Connect to OverKiz server.
 * @param {object} device - Device to set feature value.
 * @param {object} deviceFeature - Device feature to set value.
 * @param {object} value - Value to set.
 * @example
 * overkiz.setValue();
 */
async function setValue(device, deviceFeature, value) {
  const { deviceURL, state } = getNodeStateInfoByExternalId(deviceFeature);
  const overkizValue = bindValue(device, deviceFeature, value);

  logger.info(`Setting value ${value} -> ${overkizValue} for device feature ${deviceFeature.external_id}`);

  switch (state) {
    case DEVICE_STATES.HEATING_LEVEL_STATE:
      sendCommand.bind(this)(DEVICE_COMMANDS.SET_HEATING_LEVEL, deviceURL, overkizValue);
      break;
    case DEVICE_STATES.COMFORT_TEMPERATURE_STATE:
      sendCommand.bind(this)(DEVICE_COMMANDS.SET_COMFORT_TEMP, deviceURL, overkizValue);
      break;
    case DEVICE_STATES.ECO_TEMPERATURE_STATE:
      sendCommand.bind(this)(DEVICE_COMMANDS.SET_ECO_TEMP, deviceURL, overkizValue);
      break;
    default:
    //
  }
}

module.exports = {
  setValue,
};
