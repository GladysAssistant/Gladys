const get = require('get-value');
const { BadParameters } = require('../../../utils/coreErrors');
const { COMMANDS } = require('./constants');
const { cleanNames, getDeviceFeatureId } = require('../utils/convertToGladysDevice');

/**
 * @description Returns the command wrapper.
 * @param {object} zwaveJsNode - The zWaveJsDevice node.
 * @param {object} gladysDeviceFeature - The feature.
 * @returns {object} The Command Class command.
 * @example
 * getCommand(
 *  {id: 5, deviceClass: { basic: 4, generic: 17, specific: 6}},
 *  {command_class_name: 'Notification', property: 'Home Security', property_key: 'Cover Status'}
 * )
 */
function getCommand(zwaveJsNode, gladysDeviceFeature) {
  let baseCommandPath = cleanNames(gladysDeviceFeature.property_name);
  const propertyKeyNameClean = cleanNames(gladysDeviceFeature.property_key_name);
  if (propertyKeyNameClean !== '') {
    baseCommandPath += `.${propertyKeyNameClean}`;
  }

  if (gladysDeviceFeature.feature_name) {
    baseCommandPath += `.${gladysDeviceFeature.feature_name}`;
  }

  return (
    get(
      COMMANDS,
      `${cleanNames(gladysDeviceFeature.command_class_name)}.${zwaveJsNode.deviceClass.generic}-${
        zwaveJsNode.deviceClass.specific
      }.${baseCommandPath}`,
    ) || get(COMMANDS, `${cleanNames(gladysDeviceFeature.command_class_name)}.${baseCommandPath}`)
  );
}

/**
 * @description Returns a node feature from its external id.
 * @param {object} device - The node supporting the feature.
 * @param {string} featureId - The feature id to find.
 * @returns {object} The node feature if found.
 * @example
 * getDeviceFeature({
 *  external_id: 'zwavejs-ui:3',
 *  features: [{external_id: 'zwavejs-ui:3-113-0-23-7'}]
 * }, 'zwavejs-ui:3-11-0-23-7')
 */
function getDeviceFeature(device, featureId) {
  return device.features.find((f) => f.external_id === featureId);
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

  const zwaveJsNode = this.getZwaveJsDevice(device.external_id);
  if (!zwaveJsNode) {
    throw new BadParameters(`ZWaveJs-UI node not found: "${device.external_id}".`);
  }

  const command = getCommand(zwaveJsNode, deviceFeature);
  if (!command) {
    // We do not manage this feature for writing
    throw new BadParameters(`ZWaveJS-UI command not found: "${deviceFeature.external_id}"`);
  }

  const deviceContext = { device, zwaveDevice: zwaveJsNode, feature: deviceFeature };
  const commandArgs = command.getArgs(value, deviceContext);
  if (commandArgs === null) {
    throw new BadParameters(`ZWaveJS-UI command value not supported: "${value}"`);
  }

  // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=send-command
  // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=sendcommand
  const mqttPayload = {
    args: [
      {
        nodeId: deviceFeature.node_id,
        commandClass: deviceFeature.command_class,
        endpoint: deviceFeature.endpoint,
      },
      command.getName(value, deviceContext),
      commandArgs,
    ],
  };
  this.publish('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set', JSON.stringify(mqttPayload));

  if (command.getStateUpdate) {
    const stateUpdate = command.getStateUpdate(value, deviceContext);
    if (stateUpdate !== null) {
      const featureId = getDeviceFeatureId(
        zwaveJsNode.id,
        deviceFeature.command_class_name,
        deviceFeature.endpoint,
        deviceFeature.property_name,
        deviceFeature.property_key_name || '',
        stateUpdate.name || '',
      );
      const updatedFeature = getDeviceFeature(device, featureId);
      await this.gladys.device.saveState(updatedFeature, stateUpdate.value);
    }
  }
}

module.exports = {
  setValue,
};
