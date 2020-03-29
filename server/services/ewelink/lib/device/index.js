const { connect } = require('./connect');
const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');
const { status } = require('./status');

/**
 * @description Add ability to control an eWeLink device.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} eweLinkApi - EweLink Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const EweLinkHandler = new EweLinkHandler(gladys, client, serviceId);
 */
const EweLinkHandler = function EweLinkHandler(gladys, eweLinkApi, serviceId) {
  this.gladys = gladys;
  this.EweLinkApi = eweLinkApi;
  this.serviceId = serviceId;

  this.accessToken = '';
  this.apiKey = '';
  this.region = 'eu';
};

EweLinkHandler.prototype.connect = connect;
EweLinkHandler.prototype.discover = discover;
EweLinkHandler.prototype.poll = poll;
EweLinkHandler.prototype.setValue = setValue;
EweLinkHandler.prototype.status = status;

module.exports = EweLinkHandler;
