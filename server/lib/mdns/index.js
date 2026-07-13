const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const { DEFAULT_MDNS_HOSTNAME, MDNS_SERVICE_NAME, HTTP_SERVICE_TYPE } = require('./mdns.constants');
const { start } = require('./mdns.start');
const { stop } = require('./mdns.stop');
const { restart } = require('./mdns.restart');
const { getRecords } = require('./mdns.getRecords');
const { handleQuery } = require('./mdns.handleQuery');

const Mdns = function Mdns(variable, event) {
  this.variable = variable;
  this.event = event;
  /** @type {any} */
  this.mdns = null;
  /** @type {number|null} */
  this.port = null;
  this.hostname = DEFAULT_MDNS_HOSTNAME;
  this.fqdn = `${DEFAULT_MDNS_HOSTNAME}.local`;
  this.instanceFqdn = `${MDNS_SERVICE_NAME}.${HTTP_SERVICE_TYPE}`;
  /** @type {any} */
  this.announceTimeout = null;
  this.event.on(EVENTS.SYSTEM.MDNS_HOSTNAME_CHANGED, eventFunctionWrapper(this.restart.bind(this)));
};

Mdns.prototype.start = start;
Mdns.prototype.stop = stop;
Mdns.prototype.restart = restart;
Mdns.prototype.getRecords = getRecords;
Mdns.prototype.handleQuery = handleQuery;

module.exports = Mdns;
