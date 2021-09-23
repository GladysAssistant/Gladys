const logger = require('../../../../utils/logger');
const { getNodeInfoByExternalId } = require('../utils/externalId');

/**
 * @description Set value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The device feature to control.
 * @param {number} value - The value to set.
 * @example
 * zwave.setValue();
 */
function setValue(device, deviceFeature, value) {
  logger.debug(`Zwave : Setting value`);
  const { nodeId, commandClass, endpoint, property, propertyKey } = getNodeInfoByExternalId(deviceFeature.external_id);
  this.zwave.setValue({ nodeId, commandClass, endpoint, property, propertyKey }, value);
}

module.exports = {
  setValue,
};
