const get = require('get-value');
const { EVENTS } = require('../../../utils/constants');
const { STATES } = require('./constants');
const { cleanNames, getDeviceFeatureId } = require('../utils/convertToGladysDevice');

/**
 * @description This will be called when new Z-Wave node value is updated.
 * @param {object} message - Data sent by ZWave JS UI.
 * @example zwaveJSUI.onNodeValueUpdated({data: [{node}, {value}]});
 */
async function onNodeValueUpdated(message) {
  // A value has been updated: https://zwave-js.github.io/node-zwave-js/#/api/node?id=quotvalue-addedquot-quotvalue-updatedquot-quotvalue-removedquot
  const messageNode = message.data[0];
  const updatedValue = message.data[1];
  const { commandClassName, commandClass, property, propertyKey, endpoint, newValue } = updatedValue;
  const comClassNameClean = cleanNames(commandClassName);
  const propertyClean = cleanNames(property);
  const propertyKeyClean = cleanNames(propertyKey);
  let statePath = `${comClassNameClean}.${propertyClean}`;
  if (propertyKeyClean !== '') {
    statePath += `.${propertyKeyClean}`;
  }
  const valueConverted = get(STATES, `${statePath}.${newValue}`);

  const nodeId = `zwavejs-ui:${messageNode.id}`;
  const node = this.devices.find((n) => n.external_id === nodeId);
  if (!node) {
    return;
  }

  const featureId = getDeviceFeatureId(messageNode.id, commandClass, endpoint, property, propertyKey);
  const nodeFeature = node.features.find((f) => f.external_id === featureId);
  if (!nodeFeature) {
    return;
  }

  if (valueConverted !== undefined) {
    await this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: nodeFeature.external_id,
      state: valueConverted,
    });
  }
}

module.exports = {
  onNodeValueUpdated,
};
