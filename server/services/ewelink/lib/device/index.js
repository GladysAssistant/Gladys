const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { Error403, Error500 } = require('../../../../utils/httpErrors');
const { EWELINK_EMAIL_KEY, EWELINK_PASSWORD_KEY, EWELINK_REGION_KEY } = require('../utils/constants');
const { connect } = require('./connect');
const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');
const { status } = require('./status');

/**
 * @description Add ability to control an eWeLink device.
 * @param {object} gladys - Gladys instance.
 * @param {object} eweLinkApi - EweLink Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const EweLinkHandler = new EweLinkHandler(gladys, client, serviceId);
 */
const EweLinkHandler = function EweLinkHandler(gladys, eweLinkApi, serviceId) {
  this.gladys = gladys;
  this.EweLinkApi = eweLinkApi;
  this.serviceId = serviceId;

  this.configured = false;
  this.connected = false;
  this.accessToken = '';
  this.apiKey = '';
};

/**
 * @description Throw error if EweLinkApi call response has error.
 * @param {object} response - EweLinkApi call response.
 * @param {boolean} emit - True to emit message.
 * @param {boolean} config - True to reset config.
 * @example
 * const EweLinkHandler = new EweLinkHandler(gladys, client, serviceId);
 */
async function throwErrorIfNeeded(response, emit = false, config = false) {
  if (response.error) {
    if (response.error === 406) {
      this.connected = false;
      this.accessToken = '';
      this.apiKey = '';
      if (emit) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
          payload: response.msg,
        });
      }
      if (config) {
        await Promise.all([
          this.gladys.variable.setValue(EWELINK_EMAIL_KEY, '', this.serviceId),
          this.gladys.variable.setValue(EWELINK_PASSWORD_KEY, '', this.serviceId),
          this.gladys.variable.setValue(EWELINK_REGION_KEY, '', this.serviceId),
        ]);
        this.configured = false;
      }
      throw new Error403(`eWeLink: ${response.msg}`);
    }
    if (emit) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: response.msg,
      });
    }
    throw new Error500(`eWeLink: ${response.msg}`);
  }
}

EweLinkHandler.prototype.connect = connect;
EweLinkHandler.prototype.discover = discover;
EweLinkHandler.prototype.poll = poll;
EweLinkHandler.prototype.setValue = setValue;
EweLinkHandler.prototype.status = status;
EweLinkHandler.prototype.throwErrorIfNeeded = throwErrorIfNeeded;

module.exports = EweLinkHandler;
