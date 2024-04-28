const get = require('get-value');
const { BadParameters } = require('../../../utils/coreErrors');
const { COMMANDS } = require('./constants');
const { cleanNames, getDeviceFeatureId } = require('../utils/convertToGladysDevice');

/**
 * @description Returns the command wrapper.
 * @param {object} zwaveJsNode - The zWaveJsDevice node.
 * @param {object} nodeFeature - The feature.
 * @returns {object} The Command Class command.
 * @example
 * getCommand({id: 5, deviceClass: { basic: 4, generic: 17, specific: 6}}, {command_class_name: 'Notification', property: 'Home Security', property_key: 'Cover Status'})
 */
function getCommand(zwaveJsNode, nodeFeature) {
  let baseCommandPath = cleanNames(nodeFeature.property_name);
  const propertyKeyNameClean = cleanNames(nodeFeature.property_key_name);
  if (propertyKeyNameClean !== '') {
    baseCommandPath += `.${propertyKeyNameClean}`;
  }

  if (nodeFeature.feature_name) {
    baseCommandPath += `.${nodeFeature.feature_name}`;
  }

  return get(COMMANDS, `${cleanNames(nodeFeature.command_class_name)}.${zwaveJsNode.deviceClass.generic}-${zwaveJsNode.deviceClass.specific}.${baseCommandPath}`)
    || get(COMMANDS, `${cleanNames(nodeFeature.command_class_name)}.${baseCommandPath}`);
}

/**
 * @description Returns a node feature from its external id.
 * @param {object} node - The node supporting the feature.
 * @param {string} nodeFeatureId - The feature id to find.
 * @returns {object} The node feature if found.
 * @example
 * getNodeFeature({
 *  external_id: 'zwavejs-ui:3',
 *  features: [{external_id: 'zwavejs-ui:3-113-0-23-7'}]
 * }, 'zwavejs-ui:3-11-0-23-7')
 */
function getNodeFeature(node, nodeFeatureId) {
  return node.features.find((f) => f.external_id === nodeFeatureId);
}

/**
 * @description Set the new device value from Gladys to MQTT.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @returns {Promise} - The execution promise.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  if (!deviceFeature.external_id.startsWith('zwavejs-ui:')) {
    throw new BadParameters(
      `ZWaveJs-UI deviceFeature external_id is invalid: "${deviceFeature.external_id}" should starts with "zwavejs-ui:"`,
    );
  }

  const node = this.getDevice(device.external_id);
  if (!node) {
    throw new BadParameters(`ZWaveJs-UI Gladys node not found: "${device.external_id}".`);
  }

  const zwaveJsNode = this.getZwaveJsDevice(node.external_id);
  if (!zwaveJsNode) {
    throw new BadParameters(`ZWaveJs-UI node not found: "${node.external_id}".`);
  }

  const nodeFeature = getNodeFeature(node, deviceFeature.external_id);
  if (!nodeFeature) {
    throw new BadParameters(`ZWaveJs-UI feature not found: "${deviceFeature.external_id}".`);
  }

  const command = getCommand(zwaveJsNode, nodeFeature);
  if (!command) {
    // We do not manage this feature for writing
    throw new BadParameters(`ZWaveJS-UI command not found: "${deviceFeature.external_id}"`);
  }

  const commandArgs = command.getArgs(value, nodeFeature);
  if (commandArgs === null) {
    throw new BadParameters(`ZWaveJS-UI command value not supported: "${value}"`);
  }

  // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=send-command
  // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=sendcommand
  const mqttPayload = {
    args: [
      {
        nodeId: nodeFeature.node_id,
        commandClass: nodeFeature.command_class,
        endpoint: nodeFeature.endpoint,
      },
      command.getName(value, nodeFeature),
      commandArgs,
    ],
  };
  this.publish('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set', JSON.stringify(mqttPayload));

  if (command.getStateUpdate) {
    const stateUpdate = command.getStateUpdate(value, nodeFeature);
    if (stateUpdate !== null) {
      const featureId = getDeviceFeatureId(zwaveJsNode.id, nodeFeature.command_class_name, nodeFeature.endpoint, nodeFeature.property_name, nodeFeature.property_key_name || '', stateUpdate.name ||'');
      const updatedFeature = device.features.find(f => f.external_id === featureId);
      await this.gladys.device.saveState(updatedFeature, stateUpdate.value);
    }
  }
}

module.exports = {
  setValue,
};
