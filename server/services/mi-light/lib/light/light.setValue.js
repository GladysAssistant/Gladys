const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/parseExternalId');
const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Change value of a milight zone
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  const { zoneId, bridgeMac } = parseExternalId(device.external_id);
  // transform mac : adding ":"
  let macAddressStdFormat = '';
  for (let i = 0; i < 11; i += 2) {
    macAddressStdFormat += bridgeMac.slice(i, i + 2);
    if (i !== 10) {
      macAddressStdFormat += ':';
    }
  }
  const bridge = this.bridgesByMac.get(macAddressStdFormat.trim());

  if (!bridge) {
    throw new NotFoundError(`BRIDGE_NOT_FOUND`);
  }
  logger.info(
    `Connecting to milight bridge : Mac = "${bridgeMac}", ip = ${bridge.ip}, type = ${bridge.type}, name = ${bridge.name}`,
  );
  logger.debug(
    `Changing state of light ${device.external_id} with IP ${bridge.ip} . Zone = ${zoneId}. New value = ${value}`,
  );

  // const commands = await this.milightClient.commandsV6;
  // const MiLight = await this.milightClient.MilightController;
  const commands = require('node-milight-promise').commandsV6;
  const MiLight = require('node-milight-promise').MilightController;

  const light = new MiLight({
    ip: bridge.ip,
    type: bridge.type,
  });
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      value ? light.sendCommands(commands.rgbw.on(zoneId)) : light.sendCommands(commands.rgbw.off(zoneId));
      break;
    default:
      logger.debug(`Mi Light : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }

  light.pause(100);
  return light.close();
}

module.exports = {
  setValue,
};
