const { VARIABLES } = require('../../utils/constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Initialize all needs to make SmartThings works.
 * @example
 * await smartthingsHandler.init();
 */
async function init() {
  this.checkClient();

  try {
    const clientId = await this.gladys.variable.getValue(VARIABLES.SMT_PUBLIC_KEY, this.serviceId);
    const clientSecret = await this.gladys.variable.getValue(VARIABLES.SMT_SECRET_KEY, this.serviceId);

    this.createConnector(clientId, clientSecret);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SMARTTHINGS.INITIALIZATION_DONE,
    });
  } catch (e) {
    this.connector = null;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SMARTTHINGS.INITIALIZATION_FAILED,
      payload: e,
    });
  }
}

module.exports = {
  init,
};
