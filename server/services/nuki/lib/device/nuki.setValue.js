const { BadParameters } = require('../../../../utils/coreErrors');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * nukiHandler.setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const [prefix, topic] = deviceFeature.external_id.split(':');

  if (prefix !== 'nuki') {
    throw new BadParameters(`Nuki device external_id is invalid: "${externalId}" should starts with "nuki:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Nuki device external_id is invalid: "${externalId}" have no topic indicator`);
  }
  let command;
  value === 0 ? (command = 'lock') : (command = 'unlock');
  const deviceProtocol = this.getProtocolFromDevice(device);
  this.getHandler(deviceProtocol).setValue(device, command, value);
}

module.exports = {
  setValue,
};
