const Promise = require('bluebird');
const logger = require('../../utils/logger');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../utils/constants');

/**
 * @description Describe a service for the startup state: its name, and the name to display when
 * the front cannot translate it (an external integration is named by its manifest).
 * @param {object} dbService - The t_service row of the service.
 * @returns {object} The service, as `{ name, label }`.
 * @example
 * describeService({ name: 'zigbee2mqtt', type: 'internal' });
 */
function describeService(dbService) {
  const { name, type, manifest } = dbService;
  const label = type === SERVICE_TYPES.EXTERNAL && manifest && manifest.name ? manifest.name : null;
  return { name, label };
}

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

  // The services start one after the other, and one that is not started yet cannot control its
  // devices: the progress is published so the front can tell the user that Gladys is starting.
  // Promise.map does not start the services in the order of the list (past the first one, it
  // takes them from the end): the progress follows the service actually started, not the index.
  const total = servicesToLoad.length;
  let waiting = servicesToLoad.map((serviceKey) => describeService(dbServiceByKey[serviceKey]));
  let done = 0;
  this.setStartupState({ in_progress: true, total, done, current: null, waiting });

  try {
    return await Promise.map(
      servicesToLoad,
      async (serviceKey) => {
        const current = describeService(dbServiceByKey[serviceKey]);
        waiting = waiting.filter((service) => service.name !== serviceKey);
        this.setStartupState({ in_progress: true, total, done, current, waiting });
        try {
          return await this.start(serviceKey);
        } finally {
          done += 1;
        }
      },
      { concurrency: 1 },
    );
  } finally {
    this.setStartupState({ in_progress: false, total, done: total, current: null, waiting: [] });
  }
}

module.exports = {
  startAll,
};
