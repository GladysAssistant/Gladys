const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { writeBinaryValue } = require('../features/binary');
const { parseExternalId } = require('../utils/externalId');

/**
 * @description Change value of an eWeLink device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature);
 */
async function setValue(device, deviceFeature, value) {
  const { deviceId, channel } = parseExternalId(deviceFeature.external_id);
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.SWITCH.BINARY: {
      const params = {};
      // Count number of binary features to determine if "switch" or "switches" param need to be changed
      const nbBinaryFeatures = device.features.reduce(
        (acc, currentFeature) => (currentFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ? acc + 1 : acc),
        0,
      );

      const binaryValue = writeBinaryValue(value);
      if (nbBinaryFeatures > 1) {
        params.switches = [{ switch: binaryValue, outlet: channel }];
      } else {
        params.switch = binaryValue;
      }

      await this.handleRequest(async () => this.ewelinkClient.device.setThingStatus(1, deviceId, params));
      break;
    }
    default:
      logger.warn(`eWeLink: Warning, feature type "${deviceFeature.type}" not handled yet!`);
      break;
  }
}

module.exports = {
  setValue,
};
