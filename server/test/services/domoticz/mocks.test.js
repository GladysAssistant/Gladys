const EventEmitter = require('events');

const Gladys = function Gladys() {
  this.event = new EventEmitter();
  this.variable = {
    getValue: (key, serviceId) => {
      const variables = {
        DOMOTICZ_SERVER_ADDRESS: 'http://server',
        DOMOTICZ_SERVER_PORT: '8080',
      };
      return variables[key];
    },
  };
  this.stateManager = {
    get: (command, externalId) => {
      const existingDevices = {
        'domoticz:7': {
          room: 'Cuisine',
        },
      };
      return existingDevices[externalId];
    },
  };
};

const MockedClient = function MockedClient(server, port) {
  this.defaults = { baseURL: `${server}:${port}` };
};

/**
 * @description Fake a get command.
 * @param {string} url - Requested url.
 * @param {Object} params - Optional parameters.
 * @returns {Object} Returned data.
 * @example client.get('url', {})
 */
function get(url, params) {
  return {
    data: {
      status: 'OK',
    },
  };
}

/**
 * @description Fake a post command.
 * @param {string} url - Requested url.
 * @param {Object} params - Optional parameters.
 * @returns {Object} Returned data.
 * @example client.post('url', {})
 */
function post(url, params) {
  return {
    data: {
      status: 'OK',
    },
  };
}

MockedClient.prototype.get = get; // fake.returns({data: {status: 'OK'}});
MockedClient.prototype.post = post; // fake.returns({data: {status: 'OK'}});

module.exports = {
  Gladys,
  MockedClient,
};
