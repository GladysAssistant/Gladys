const logger = require('../../../utils/logger');
const { convertValue } = require('./utils/convertValue');
const { getNodeInfoByExternalId } = require('./utils/externalId');

/**
 * @description Send the new device value over device protocol.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const { nodeId, classId, instance, propertyKey } = getNodeInfoByExternalId(deviceFeature.external_id);
  const topic = `zwave2mqtt/${nodeId}/${classId}/${instance}/${propertyKey}/set`.replace('currentValue', 'targetValue');

  logger.debug(
    `Changing state of device = ${device.external_id}, feature = ${deviceFeature.external_id}, value = ${value}`,
  );

  // Send message to Zwave2mqtt topics
  return new Promise((resolve, reject) => {
    this.mqttService.device.publish(topic, convertValue(deviceFeature, value), undefined, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  setValue,
};
