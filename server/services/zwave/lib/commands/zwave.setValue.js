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
      {
        // Don't emit the added/updated events, as this will spam applications with untranslated events
        noEvent: true,
        // Don't throw when there is an invalid Value ID in the cache
        // noThrow: true,
      },
    );
}

module.exports = {
  setValue,
};
