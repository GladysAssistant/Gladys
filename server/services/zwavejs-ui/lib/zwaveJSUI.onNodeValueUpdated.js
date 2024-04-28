const get = require('get-value');
const { EVENTS } = require('../../../utils/constants');
const { STATES } = require('./constants');
const { cleanNames, getDeviceFeatureId } = require('../utils/convertToGladysDevice');

/**
 * @description This will be called when new Z-Wave node value is updated.
 * @param {object} message - Data sent by ZWave JS UI.
 * @returns {Promise} - Promise execution.
 * @example zwaveJSUI.onNodeValueUpdated({data: [{node}, {value}]});
 */
function onNodeValueUpdated(message) {
  // A value has been updated: https://zwave-js.github.io/node-zwave-js/#/api/node?id=quotvalue-addedquot-quotvalue-updatedquot-quotvalue-removedquot
  const messageNode = message.data[0];
  const updatedValue = message.data[1];
  const { commandClassName, propertyName, propertyKeyName, endpoint, newValue } = updatedValue;
  const comClassNameClean = cleanNames(commandClassName);
  const propertyNameClean = cleanNames(propertyName);
  const propertyKeyNameClean = cleanNames(propertyKeyName);
  let baseStatePath = propertyNameClean;
  if (propertyKeyNameClean !== '') {
    baseStatePath += `.${propertyKeyNameClean}`;
  }

  const nodeId = `zwavejs-ui:${messageNode.id}`;
  const node = this.getDevice(nodeId);
  if (!node) {
    return Promise.resolve();
  }

  const zwaveJSNode = this.getZwaveJsDevice(nodeId);
  if (!zwaveJSNode) {
    return Promise.resolve();
  }

  let valueConverters =
    get(
      STATES,
      `${comClassNameClean}.${zwaveJSNode.deviceClass.generic}-${zwaveJSNode.deviceClass.specific}.${baseStatePath}`,
    ) || get(STATES, `${comClassNameClean}.${baseStatePath}`);

  if (!valueConverters) {
    return Promise.resolve();
  }

  if (!Array.isArray(valueConverters)) {
    valueConverters = [
      {
        name: '',
        converter: valueConverters,
      },
    ];
  }

  const promises = [];
  for (let i = 0; i < valueConverters.length; i += 1) {
    const valueConverter = valueConverters[i];
    const externalId = getDeviceFeatureId(
      messageNode.id,
      commandClassName,
      endpoint,
      propertyName,
      propertyKeyName,
      valueConverter.name,
    );

    if (node.features.some((f) => f.external_id === externalId)) {
      const convertedValue = valueConverter.converter(newValue);
      if (convertedValue !== null) {
        promises.push(
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: externalId,
            state: convertedValue,
          }),
        );
      }
    }
  }

  if (promises.length > 0) {
    return Promise.allSettled(promises);
  }

  return Promise.resolve();
}

module.exports = {
  onNodeValueUpdated,
};
