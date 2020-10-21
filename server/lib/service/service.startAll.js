const Promise = require('bluebird');

/**
 * @public
 * @description Start all services
 * @returns {Promise} - Resolve when all services are started.
 * @example
 * service.startAll();
 */
async function startAll() {
  return Promise.map(Object.keys(this.getServices()), (serviceKey) => this.start(serviceKey), { concurrency: 1 });
}

module.exports = {
  startAll,
};
