const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { TP_LINK_EXTERNAL_ID_BASE, TP_LINK_IP_ADDRESS } = require('../utils/consts');

const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { parseExternalId } = require('../utils/parseExternalId');
const { getDeviceFeature } = require('../../../../utils/device');

/**
 * @description Poll value of a TP-Link Plug and emit event if necessary.
 * @param {object} self - This.
 * @param {object} device - Device.
 * @param {object} deviceSysInfo - Device Sys Info to get relay_state.
 * @param {object} deviceId - Device Id to emit proper event.
 * @example
 * pollAndCompareStateForPlug(this, device,deviceSysInfo, deviceId);
 */
function pollAndCompareStateForPlug(self, device, deviceSysInfo, deviceId) {
  const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY);
  const newState = deviceSysInfo.relay_state;
  if (binaryFeature && binaryFeature.last_value !== newState) {
    logger.debug(`Polling TP-Link Plug ${deviceId}, new value = ${newState}`);
    self.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceId}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      state: newState,
    });
  }
}

/**
 * @description Poll value of a TP-Link Bulb and emit event if necessary.
 * @param {object} self - This.
 * @param {object} device - Device.
 * @param {object} deviceSysInfo - Device Sys Info to get light_state.
 * @param {object} deviceId - Device Id to emit proper event.
 * @example
 * pollAndCompareStateForBulb(this, device,deviceSysInfo, deviceId);
 */
function pollAndCompareStateForBulb(self, device, deviceSysInfo, deviceId) {
  const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
  const newState = deviceSysInfo.light_state.on_off;
  if (binaryFeature && binaryFeature.last_value !== newState) {
    logger.debug(`Polling TP-Link Bulb ${deviceId}, new value = ${newState}`);
    self.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      state: newState,
    });
  }
}

/**
 * @description Poll value of a TP-Link Device.
 * @param {object} device - The device to control.
 * @returns {Promise} Promise.
 * @example
 * poll(device);
 */
async function poll(device) {
  const deviceId = parseExternalId(device.external_id);
  const devices = await this.gladys.device.get({ service: 'tp-link' });
  const internalDevice = devices.find((d) => d.external_id === device.external_id);
  if (!internalDevice) {
    throw new NotFoundError(`TP_LINK_DEVICE_NOT_FOUND`);
  }

  const deviceIp = internalDevice.params.find((p) => p.name === TP_LINK_IP_ADDRESS).value;
  const tpLinkDevice = await this.client.getDevice({ host: deviceIp });
  const deviceSysInfo = await tpLinkDevice.getSysInfo();
  const type = deviceSysInfo.type ? deviceSysInfo.type : deviceSysInfo.mic_type;
  switch (type) {
    case 'IOT.SMARTPLUGSWITCH':
    case 'IOT.RANGEEXTENDER.SMARTPLUG':
      pollAndCompareStateForPlug(this, device, deviceSysInfo, deviceId);
      break;
    case 'IOT.SMARTBULB':
      pollAndCompareStateForBulb(this, device, deviceSysInfo, deviceId);
      break;
    default:
      logger.error(`Polling TP-Link Device ${deviceId} - not managed`);
      throw new NotFoundError(`TP_LINK_DEVICE_NOT_MANAGED`);
  }
}

module.exports = {
  poll,
};
