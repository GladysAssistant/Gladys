const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const db = require('../../models');

/**
 * @public
 * @description Start one service by name.
 * @param {string} name - The name of the service.
 * @param {string} podId - ID of Gladys instance.
 * @returns {Promise<object>} Requested service.
 * @example
 * service.start('telegram');
 */
async function start(name, podId = null) {
  const serviceInDb = await db.Service.findOne({
    where: {
      pod_id: podId,
      name,
    },
  });

  try {
    const service = this.getService(name);

    // Before starting service, set service status to loading
    let status = SERVICE_STATUS.LOADING;
    // Store service status
    serviceInDb.set({ status });
    await serviceInDb.save();

    try {
      await service.start();
      // Once service started, set service status to ready
      status = SERVICE_STATUS.RUNNING;
    } catch (e) {
      if (e instanceof ServiceNotConfiguredError) {
        // If service fails to start due to configuration error, set service status to not configured
        status = SERVICE_STATUS.RUNNING;
        logger.info(`Service ${name} is not configured, so it was not started.`);
      } else {
        // If service fails to start, set service status to error
        status = SERVICE_STATUS.ERROR;
        logger.warn(`Unable to start service ${name}`, e);
      }
    } finally {
      // Store service status
      serviceInDb.set({ status });
      await serviceInDb.save();
    }
  } catch (e) {
    logger.warn(`Unable to save service state`, e);
  }

  if (!serviceInDb) {
    return null;
  }

  return serviceInDb.get({ plain: true });
}

module.exports = {
  start,
};
