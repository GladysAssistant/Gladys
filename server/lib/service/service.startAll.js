const Promise = require('bluebird');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * @public
 * @description Start all services.
 * @returns {Promise} - Resolve when all services are started.
 * @example
 * service.startAll();
 */
async function startAll() {
  // Prepares services to load according to it's status
  const dbServices = await this.getAll();
  const dbServiceByKey = {};
  dbServices.forEach((service) => {
    dbServiceByKey[service.name] = service;
  });

  const serviceKeys = Object.keys(this.getServices());
  const servicesToLoad = serviceKeys.filter((serviceKey) => {
    const dbService = dbServiceByKey[serviceKey];
    if (!dbService) {
      return false;
    }

    const { status } = dbService;
    switch (status) {
      case SERVICE_STATUS.STOPPED:
        logger.info(`Service ${serviceKey} was manually stopped, so it is ignored at startup`);
        return false;
      default:
        return true;
    }
  });

  return Promise.map(servicesToLoad, (serviceKey) => this.start(serviceKey), { concurrency: 1 });
}

module.exports = {
  startAll,
};
