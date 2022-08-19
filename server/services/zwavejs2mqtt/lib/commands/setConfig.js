const logger = require('../../../../utils/logger');
const { COMMAND_CLASSES } = require('../constants');

/**
 * @description Set configuration.
 * @param {Object} device - The device to control.
 * @param {Object} deviceParam - The device parameter to set.
 * @param {number} value - The value to set.
 * @example
 * zwave.setConfig();
 */
function setConfig(device, deviceParam, value) {
  // const { nodeId, commandClass, endpoint, property, propertyKey } = getNodeInfoByExternalId(deviceParam.external_id);
  const nodeId = device.rawZwaveNode.id;
  logger.debug(`Zwave : Setting parameter ${deviceParam.name} for node ${nodeId}: ${value}`);
  this.driver.controller.nodes.get(nodeId).setValue(
    {
      nodeId,
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_CONFIGURATION,
      endpoint: 0,
      property: deviceParam.name,
    },
    value,
  );
}

module.exports = {
  setConfig,
};
