const get = require('get-value');
const { BadParameters } = require('../../../utils/coreErrors');
const { COMMANDS } = require('./constants');

/**
 * @description Returns the feature nodeId.
 * @param {object} deviceFeature - The feature.
 * @returns {number} The nodeId.
 * @example
 * getFeatureNodeId({name:'4:binary_switch:0:currentvalue:1', external_id: 'zwavejs-ui:4:37:0:currentvalue'})
 */
function getFeatureNodeId(deviceFeature) {
  return parseInt(deviceFeature.external_id.split(':')[1], 10);
}

/**
 * @description Returns the feature commandClass.
 * @param {object} deviceFeature - The feature.
 * @returns {string} The commandClass.
 * @example
 * getFeatureCommandClass({name:'4:binary_switch:0:currentvalue:1', external_id: 'zwavejs-ui:4:37:0:currentvalue'})
 */
function getFeatureCommandClass(deviceFeature) {
  return deviceFeature.external_id.split(':')[2];
}

/**
 * @description Returns the feature commandClassVersion.
 * @param {object} deviceFeature - The feature.
 * @returns {number} The commandClass Version.
 * @example
 * getFeatureCommandClass({name:'4:binary_switch:0:currentvalue:1', external_id: 'zwavejs-ui:4:37:0:currentvalue'})
 */
function getFeatureCommandClassVersion(deviceFeature) {
  const segments = deviceFeature.name.split(':');

  return parseInt(segments[segments.length-1], 10);
}

/**
 * @description Returns the feature endpoint.
 * @param {object} deviceFeature - The feature.
 * @returns {number} The endpoint.
 * @example
 * getFeatureEndpoint({name:'4:binary_switch:0:currentvalue:1', external_id: 'zwavejs-ui:4:37:0:currentvalue'})
 */
function getFeatureEndpoint(deviceFeature) {
  return parseInt(deviceFeature.external_id.split(':')[3], 10);
}

/**
 * @description Returns the command wrapper.
 * @param {object} deviceFeature - The feature.
 * @returns {object} The Command Class command.
 * @example
 * getCommandName({name:'4:binary_switch:0:currentvalue:1', external_id: 'zwavejs-ui:4:37:0:currentvalue'})
 */
function getCommand(deviceFeature) {
  const segments = deviceFeature.name.split(':');
  let commandPath = `${segments[1]}.${segments[3]}`;
  if (segments.length === 6) {
    // There is a property key
    commandPath += `.${segments[4]}`;
  }

  console.log('looking for path %o', {commandPath, segments});
  return get(COMMANDS, commandPath);
}

/**
 * @description Set the new device value from Gladys to MQTT.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;

  if (!externalId.startsWith('zwavejs-ui:')) {
    throw new BadParameters(
      `ZWaveJs-UI device external_id is invalid: "${externalId}" should starts with "zwavejs-ui:"`,
    );
  }

  const command = getCommand(deviceFeature);
  if (!command) {
    // We do not manage this feature for writing
    throw new BadParameters(`ZWaveJS-UI command not found: "${deviceFeature.name}"`);
  }

  const commandClassVersion = getFeatureCommandClassVersion(deviceFeature);

  // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=send-command
  // https://zwave-js.github.io/zwave-js-ui/#/guide/mqtt?id=sendcommand
  const mqttPayload = JSON.stringify({ 
    args:[{
      nodeId: getFeatureNodeId(deviceFeature),
      commandClass: getFeatureCommandClass(deviceFeature),
      endpoint: getFeatureEndpoint(deviceFeature),
    },
    command.getName(deviceFeature, commandClassVersion),
    command.getArgs(value, commandClassVersion)
    ] 
  });
  this.publish('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set', mqttPayload);
}

module.exports = {
  setValue,
};
