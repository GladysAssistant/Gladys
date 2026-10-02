const Promise = require('bluebird');
const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { PARAMS, POLL_TIMEOUT } = require('../utils/broadlink.constants');

/**
 * @description Poll device feature values.
 * @param {object} device - Gladys device.
 * @example
 * await poll(device);
 */
async function poll(device) {
  const { params = [] } = device;

  const peripheralParam = params.find((p) => p.name === PARAMS.PERIPHERAL);

  if (!peripheralParam) {
    throw new BadParameters(`${device.external_id} device is not well configured, please try to update it`);
  }

  const broadlinkDevice = await this.getDevice(peripheralParam.value);
  const deviceMapper = this.loadMapper(broadlinkDevice);

  if (!deviceMapper) {
    throw new BadParameters(`${device.external_id} device is not managed by Broadlink for polling`);
  }

  if (typeof deviceMapper.poll !== 'function') {
    logger.debug(`Broadlink device ${device.external_id} is not pollable`);
    return;
  }

  logger.debug(`Broadlink polling ${device.external_id}...`);
  // an unreachable device must not block the devices polled after it
  const messages = await Promise.resolve(deviceMapper.poll(broadlinkDevice, device)).timeout(
    POLL_TIMEOUT,
    `Broadlink device ${device.external_id} did not answer to polling`,
  );

  messages.forEach((message) => {
    logger.debug(`Broadlink polled ${message.device_feature_external_id}, new value = ${message.state}`);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, message);
  });
}

module.exports = {
  poll,
};
