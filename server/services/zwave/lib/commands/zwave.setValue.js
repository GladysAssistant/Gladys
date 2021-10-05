const logger = require('../../../../utils/logger');
const { bindValue } = require('../utils/bindValue');
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
  const { nodeId, commandClass, endpoint, property, propertyKey } = getNodeInfoByExternalId(deviceFeature.external_id);
  logger.debug(`Zwave : Setting value for feature ${deviceFeature.name}: ${value}`);
  this.driver.controller.nodes
    .get(nodeId)
    .setValue(
      { nodeId, commandClass, endpoint, property, propertyKey },
      bindValue({ nodeId, commandClass, endpoint, property, propertyKey }, value),
    );
}

module.exports = {
  setValue,
};
