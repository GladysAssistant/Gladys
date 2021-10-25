const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/externalId');

module.exports = {
  // Gladys feature
  generateFeature: (name, channel = 0) => {
    return {
      name: `${name}${channel > 0 ? ` Ch${channel}` : ''} On/Off`,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    };
  },
  pollBinary: (eWeLinkDevice, feature) => {
    const { deviceId, channel } = parseExternalId(feature.external_id);
    let state = (eWeLinkDevice.params && eWeLinkDevice.params.switch) || false;
    const switches = (eWeLinkDevice.params && eWeLinkDevice.params.switches) || false;
    if (state || switches) {
      if (switches) {
        state = switches[channel - 1].switch;
      }
    }
    const currentBinaryState = state === 'on' ? STATE.ON : STATE.OFF;
    // if the value is different from the value we have, save new state
    if (state && feature.last_value !== currentBinaryState) {
      logger.debug(`eWeLink: Polling device "${deviceId}", binary new value = ${currentBinaryState}`);
      return currentBinaryState;
    }
    return null;
  },
  // Gladys vs eWeLink transformers
  writeBinaryValue: (value) => {
    return value ? 'on' : 'off';
  },
};
