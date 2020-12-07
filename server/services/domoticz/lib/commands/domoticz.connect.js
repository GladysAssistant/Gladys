const logger = require('../../../../utils/logger');
const { command } = require('./domoticz.command');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Connect to a Domoticz server and check status.
 * @param {any} client - Axios client to use for get/post.
 * @example
 * domoticz.connect(client);
 */
async function connect(client) {
  logger.debug(`Domoticz: connect (${client.defaults.baseURL})`);
  this.connected = false;
  this.client = client;

  try {
    const data = await command(this.client, {
      type: 'command',
      param: 'getversion',
    });
    this.connected = true;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_READY,
      payload: {
        version: data.version,
        hash: data.hash,
        SystemName: data.SystemName,
      },
    });
    logger.debug(`Domoticz server running, version ${data.version}`);
  } catch (err) {
    logger.error(`Domoticz: connection failed on ${err.message}`);
    this.client = null;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_FAILED,
      payload: { err },
    });
    throw err;
  }

  return {};
}

module.exports = {
  connect,
};
