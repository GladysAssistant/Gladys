const { CONFIGURATION } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Disconnect netatmo.
 * @example
 * netatmo.disconnect();
 */
async function disconnect() {
  try {
    this.gladys.variable.setValue(CONFIGURATION.NETATMO_IS_CONNECT, 'disconnect', this.serviceId);
    this.connected = false;
    clearInterval(this.pollHomeCoachWeather);
    clearInterval(this.pollEnergy);
    clearInterval(this.pollSecurity);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.DISCONNECTED,
    });
  } catch (error) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
      payload: 'Failed disconnect Netatmo',
    });
    throw new NotFoundError(`NETATMO: Failed disconnect service`);
  }
}

module.exports = {
  disconnect,
};
