const logger = require('../../../../utils/logger');
const { command } = require('./domoticz.command');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { parseValues } = require('../../utils/domoticz.devices');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Polling requested device.
 * @param {any} device - Device to poll.
 * @example
 * domoticz.poll({});
 */
async function poll(device) {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('DOMOTICZ_NOT_CONNECTED');
  }
  logger.debug(`Domoticz: poll device ${device.name}`);

  try {
    const data = await command(this.client, {
      type: 'devices',
      rid: device.external_id.split(':').pop(),
    });
    const values = parseValues(device, data.result[0]);
    values.forEach((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, value);
    });
  } catch (err) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.DEVICE_FAILED,
      payload: {
        selector: device.selector,
        err,
      },
    });
    throw err;
  }
}

module.exports = {
  poll,
};
