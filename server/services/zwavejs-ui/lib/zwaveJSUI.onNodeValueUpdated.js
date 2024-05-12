const Promise = require('bluebird');
const { EVENTS } = require('../../../utils/constants');
const { STATES } = require('./constants');
const { getDeviceFeatureId } = require('../utils/convertToGladysDevice');
const getProperty = require('../utils/getProperty');

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

  const nodeId = `zwavejs-ui:${messageNode.id}`;
  const node = this.getDevice(nodeId);
  if (!node) {
    return Promise.resolve();
  }

  const zwaveJSNode = this.getZwaveJsDevice(nodeId);
  if (!zwaveJSNode) {
    return Promise.resolve();
  }

  const valueConverters = getProperty(STATES, commandClassName, propertyName, propertyKeyName, zwaveJSNode.deviceClass);

  if (!valueConverters) {
    return Promise.resolve();
  }

  return Promise.map(
    valueConverters,
    async (valueConverter) => {
      const externalId = getDeviceFeatureId(
        messageNode.id,
        commandClassName,
        endpoint,
        valueConverter.property_name || propertyName,
        valueConverter.property_name ? valueConverter.property_key_name || '' : propertyKeyName,
        valueConverter.feature_name || '',
      );

      if (node.features.some((f) => f.external_id === externalId)) {
        const convertedValue = valueConverter.converter(newValue);
        if (convertedValue !== null) {
          await this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: externalId,
            state: convertedValue,
          });
        }
      }
    },
    { concurrency: 2 },
  );
}

module.exports = {
  onNodeValueUpdated,
};
