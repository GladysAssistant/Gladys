const get = require('get-value');
const { EVENTS } = require('../../../utils/constants');
const { STATES } = require('./constants');
const { cleanNames } = require('../utils/convertToGladysDevice');


const getDeviceFeatureExternalId = (nodeId, commandClass, endpoint, property, propertyKey) =>
  `zwavejs-ui:${nodeId}-${commandClass}-${endpoint}-${property}${propertyKey ? `-${propertyKey}` : ''}`;


/**
 * @description This will be called when new Z-Wave node value is updated.
 * @param {object} message - Data sent by ZWave JS UI.
 * @example zwaveJSUI.onNodeValueUpdated({data: [{node}, {value}]});
 */
function onNodeValueUpdated(message) {
  // A value has been updated: https://zwave-js.github.io/node-zwave-js/#/api/node?id=quotvalue-addedquot-quotvalue-updatedquot-quotvalue-removedquot
  const node = message.data[0];
  const updatedValue = message.data[1];
  const { commandClassName, commandClass, property, propertyKey, endpoint, newValue } = updatedValue;
  const comClassNameClean = cleanNames(commandClassName);
  const propertyClean = cleanNames(property);
  const propertyKeyClean = cleanNames(propertyKey);
  let statePath = `${comClassNameClean}.${propertyClean}`;
  if (propertyKeyClean !== '') {
    statePath += `.${propertyKeyClean}`;
  }
  const valueConverted = get(
    STATES,
    `${statePath}.${newValue}`,
  );
  if (valueConverted !== undefined) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId(
        node.id,
        commandClass,
        endpoint,
        property,
        propertyKey,
      ),
      state: valueConverted,
    });
  }
}

module.exports = {
  onNodeValueUpdated,
};
