const get = require('get-value');
const { BadParameters } = require('../../../utils/coreErrors');
const { ACTIONS } = require('./constants');
const { cleanNames, getDeviceFeatureId } = require('../utils/convertToGladysDevice');

/**
 * @description Returns the action wrapper.
 * @param {object} zwaveJsNode - The zWaveJsDevice node.
 * @param {object} nodeFeature - The feature.
 * @returns {object} The Command Class action.
 * @example
 * getAction(
 *  {id: 5, deviceClass: { basic: 4, generic: 17, specific: 6}},
 *  {command_class_name: 'Notification', property: 'Home Security', property_key: 'Cover Status'}
 * )
 */
function getAction(zwaveJsNode, nodeFeature) {
  let baseCommandPath = cleanNames(nodeFeature.property_name);
  const propertyKeyNameClean = cleanNames(nodeFeature.property_key_name);
  if (propertyKeyNameClean !== '') {
    baseCommandPath += `.${propertyKeyNameClean}`;
  }

  if (nodeFeature.feature_name) {
    baseCommandPath += `.${nodeFeature.feature_name}`;
  }

  return (
    get(
      ACTIONS,
      `${cleanNames(nodeFeature.command_class_name)}.${zwaveJsNode.deviceClass.generic}-${
        zwaveJsNode.deviceClass.specific
      }.${baseCommandPath}`,
    ) || get(ACTIONS, `${cleanNames(nodeFeature.command_class_name)}.${baseCommandPath}`)
  );
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
 * @param {object} gladysDevice - Updated Gladys device.
 * @param {object} gladysFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @returns {Promise} - The execution promise.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(gladysDevice, gladysFeature, value) {
  if (!gladysFeature.external_id.startsWith('zwavejs-ui:')) {
    throw new BadParameters(
      `ZWaveJs-UI deviceFeature external_id is invalid: "${gladysFeature.external_id}" should starts with "zwavejs-ui:"`,
    );
  }

  const node = this.getDevice(gladysDevice.external_id);
  if (!node) {
    throw new BadParameters(`ZWaveJs-UI Gladys node not found: "${gladysDevice.external_id}".`);
  }

  const zwaveJsNode = this.getZwaveJsDevice(node.external_id);
  if (!zwaveJsNode) {
    throw new BadParameters(`ZWaveJs-UI node not found: "${node.external_id}".`);
  }

  const nodeFeature = getNodeFeature(node, gladysFeature.external_id);
  if (!nodeFeature) {
    throw new BadParameters(`ZWaveJs-UI feature not found: "${gladysFeature.external_id}".`);
  }

  const actionDescriptor = getAction(zwaveJsNode, nodeFeature);
  if (!actionDescriptor) {
    // We do not manage this feature for writing
    throw new BadParameters(`ZWaveJS-UI action not found: "${gladysFeature.external_id}"`);
  }

  const nodeContext = { node, nodeFeature, zwaveJsNode, gladysDevice, gladysFeature };
  const action = actionDescriptor(value, nodeContext);
  if (action.isCommand) {
    // API sendCommand
    // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=sendcommand
    const mqttPayload = {
      args: [
        {
          nodeId: nodeFeature.node_id,
          commandClass: nodeFeature.command_class,
          endpoint: nodeFeature.endpoint,
        },
        action.name,
        action.value,
      ],
    };
    this.publish('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set', JSON.stringify(mqttPayload));
  } else {
    // API writeValue
    // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=writevalue
    const mqttPayload = {
      args: [
        {
          nodeId: nodeFeature.node_id,
          commandClass: nodeFeature.command_class,
          endpoint: nodeFeature.endpoint,
          property: action.name,
        },
        action.value,
      ],
    };
    this.publish('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/writeValue/set', JSON.stringify(mqttPayload));
  }

  if (action.stateUpdate) {
    const promises = [];
    Object.keys(action.stateUpdate).forEach((featureName) => {
      const featureId = getDeviceFeatureId(
        zwaveJsNode.id,
        nodeFeature.command_class_name,
        nodeFeature.endpoint,
        nodeFeature.property_name,
        nodeFeature.property_key_name || '',
        featureName,
      );
      const gladysUpdatedFeature = gladysDevice.features.find((f) => f.external_id === featureId);
      promises.push(this.gladys.device.saveState(gladysUpdatedFeature, action.stateUpdate[featureName]));
    });

    await Promise.allSettled(promises);
  }
}

module.exports = {
  setValue,
};
