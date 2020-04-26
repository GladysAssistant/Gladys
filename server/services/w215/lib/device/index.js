const Bottleneck = require('bottleneck/es5');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { Error401, Error500 } = require('../../../../utils/httpErrors');
const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');
const { testConnection} = require('./testConnection');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000, // 1 s
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

/**
 * @description Add ability to control an DSP-W215 device.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const W215Handler = new W215Handler(gladys, serviceId);
 */

const W215Handler = function W215Handler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configured = false;
  this.connected = false;
  this.ip_adress = '';
  this.username = 'admin';
  this.pin_code = '';
};

/**
 * @description Throw error if dns-sd call response has error.
 * @param {Object} response - dns-sd call response.
 * @param {boolean} emit - True to emit message.
 * @example
 * this.throwErrorIfNeeded(res, true);
 */
function throwErrorIfNeeded(response, emit = false) {
  // TODO : adapter fonction des erreurs constatées à l'appel du module dns-sd
  if (response.error) {
    if (response.error === 401) {
      this.connected = false;
      this.accessToken = '';
      this.apiKey = '';
      if (emit) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.W215.ERROR,
          payload: response.msg,
        });
      }
      throw new Error401(`W215 error: ${response.msg}`);
    }
    if (emit) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.W215.ERROR,
        payload: response.msg,
      });
    }
    throw new Error500(`W215 error: ${response.msg}`);
  }
}

W215Handler.prototype.discover = discover;
W215Handler.prototype.testConnection = testConnection;
W215Handler.prototype.poll = pollLimiter.wrap(poll);
W215Handler.prototype.setValue = setValueLimiter.wrap(setValue);
W215Handler.prototype.throwErrorIfNeeded = throwErrorIfNeeded;

module.exports = W215Handler;
