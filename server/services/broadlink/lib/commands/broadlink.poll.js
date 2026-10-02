const Promise = require('bluebird');
const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { PARAMS, POLL_TIMEOUT } = require('../utils/broadlink.constants');

/**
 * @description Runs the device mapper poll, with a timeout.
 * The node-broadlink library waits for a device answer forever, with a listener on the device socket. When the poll
 * times out, only the listeners of the requests sent by this poll are removed: a switch command sent at the same time
 * keeps waiting for its answer.
 * @param {object} deviceMapper - Device mapper.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} device - Gladys device.
 * @returns {Promise<Array>} Resolve with messages to emit.
 * @example
 * await pollWithTimeout(deviceMapper, broadlinkDevice, device);
 */
async function pollWithTimeout(deviceMapper, broadlinkDevice, device) {
  const { socket } = broadlinkDevice;
  const pollListeners = [];
  // the same device, keeping track of the socket listener added by each request of this poll
  const polledDevice = Object.create(broadlinkDevice, {
    sendPacket: {
      value: (...args) => {
        const request = broadlinkDevice.sendPacket(...args);
        pollListeners.push(socket.rawListeners('message').pop());
        return request;
      },
    },
  });

  try {
    // an unreachable device must not block the devices polled after it
    return await Promise.resolve(deviceMapper.poll(polledDevice, device)).timeout(
      POLL_TIMEOUT,
      `Broadlink device ${device.external_id} did not answer to polling`,
    );
  } catch (e) {
    if (e instanceof Promise.TimeoutError) {
      pollListeners.forEach((listener) => socket.removeListener('message', listener));
    }
    throw e;
  }
}

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
  const messages = await pollWithTimeout(deviceMapper, broadlinkDevice, device);

  messages.forEach((message) => {
    logger.debug(`Broadlink polled ${message.device_feature_external_id}, new value = ${message.state}`);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, message);
  });
}

module.exports = {
  poll,
};
