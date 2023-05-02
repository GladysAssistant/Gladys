const logger = require('../../../../utils/logger');
const { bindValue } = require('../utils/bindValue');
const { getNodeInfoByExternalId } = require('../utils/externalId');

/**
 * @description Set value.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The device feature to control.
 * @param {number} value - The value to set.
 * @example
 * zwave.setValue();
 */
function setValue(device, deviceFeature, value) {
  const { nodeId, commandClass, endpoint, property, propertyKey } = getNodeInfoByExternalId(deviceFeature.external_id);
  logger.debug(`Zwave : Setting value for feature ${deviceFeature.name} of device ${nodeId}: ${value}`);
  const zwaveValue = bindValue({ nodeId, commandClass, endpoint, property, propertyKey }, value);

  this.mqttClient.publish(
    `${this.mqttTopicPrefix}/${
      this.mqttTopicWithLocation ? `${this.nodes[nodeId].loc}/` : ''
    }nodeID_${nodeId}/${commandClass}/${endpoint}/${property}${propertyKey !== undefined ? `/${propertyKey}` : ''}/set`,
    zwaveValue.toString(),
  );
}

module.exports = {
  setValue,
};
