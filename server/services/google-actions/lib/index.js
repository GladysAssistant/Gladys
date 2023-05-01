const { onSync } = require('./smarthome/googleActions.onSync');
const { onQuery } = require('./smarthome/googleActions.onQuery');
const { onExecute } = require('./smarthome/googleActions.onExecute');

/**
 * @description Add ability to connect to Google Actions.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
 */
const GoogleActionsHandler = function GoogleActionsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.usersConnectedGoogleHomeGateway = new Set();
};

// GoogleActions functions
GoogleActionsHandler.prototype.onSync = onSync;
GoogleActionsHandler.prototype.onQuery = onQuery;
GoogleActionsHandler.prototype.onExecute = onExecute;

module.exports = GoogleActionsHandler;
