const { init } = require('./internal/googleActions.init');
const { stop } = require('./internal/googleActions.stop');
const { checkClient } = require('./internal/googleActions.checkClient');
const { storeParams } = require('./internal/googleActions.storeParams');
const { dispatchQuery } = require('./smarthome/googleActions.dispatchQuery');
const { onDisconnect } = require('./smarthome/googleActions.onDisconnect');
const { onSync } = require('./smarthome/googleActions.onSync');
const { onQuery } = require('./smarthome/googleActions.onQuery');
const { onExecute } = require('./smarthome/googleActions.onExecute');
const { reportState } = require('./smarthome/googleActions.reportState');
const { requestSync } = require('./smarthome/googleActions.requestSync');

/**
 * @description Add ability to connect to Google Actions.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
 */
const GoogleActionsHandler = function GoogleActionsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.smarthome = null;
  this.userSmarthome = {};

  this.reportState = this.reportState.bind(this);
};

// Internal functions
GoogleActionsHandler.prototype.init = init;
GoogleActionsHandler.prototype.stop = stop;
GoogleActionsHandler.prototype.checkClient = checkClient;
GoogleActionsHandler.prototype.storeParams = storeParams;

// GoogleActions functions
GoogleActionsHandler.prototype.dispatchQuery = dispatchQuery;
GoogleActionsHandler.prototype.onDisconnect = onDisconnect;
GoogleActionsHandler.prototype.onSync = onSync;
GoogleActionsHandler.prototype.onQuery = onQuery;
GoogleActionsHandler.prototype.onExecute = onExecute;
GoogleActionsHandler.prototype.reportState = reportState;
GoogleActionsHandler.prototype.requestSync = requestSync;

module.exports = GoogleActionsHandler;
