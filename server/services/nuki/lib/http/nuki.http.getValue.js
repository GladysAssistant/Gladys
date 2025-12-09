const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { MAPPING_STATES_NUKI_TO_GLADYS, MAPPING_SWITCH_NUKI_TO_GLADYS } = require('../utils/nuki.constants');

/**
 * @description Get device values through HTTP.
 * @param {object} device - Gladys device.
 * @example
 * nukiHttpHandler.getValue(device);
 */
async function getValue(device) {
  const { gladys } = this.nukiHandler;
  const smartlockId = device.external_id.split(':')[1];
  const values = await this.nukiApi.getSmartlock(smartlockId);

  // poll battery
  const { batteryCharge } = values.state;
  logger.debug(`Lock ${device.external_id} has ${batteryCharge}% batteryCharge`);
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:battery`,
    state: Math.round(batteryCharge),
  });

  // poll state
  const { state } = values.state;
  logger.debug(`Lock ${device.external_id} is in ${state} state`);
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:state`,
    state: MAPPING_STATES_NUKI_TO_GLADYS[state],
  });

  // Update button state
  logger.debug(
    `Lock ${device.external_id} is in ${state} state and button will be in ${MAPPING_SWITCH_NUKI_TO_GLADYS[state]} state`,
  );
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:button`,
    state: MAPPING_SWITCH_NUKI_TO_GLADYS[state],
  });
}

module.exports = {
  getValue,
};
