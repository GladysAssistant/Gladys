const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const db = require('../../models');

/**
 * @public
 * @description Start one service by name
 * @param {string} name - The name of the service.
 * @example
 * service.start('telegram');
 */
async function start(name) {
  try {
    const service = this.stateManager.get('service', name);

    // Load service from DB
    const serviceInDb = await db.Service.findOne({
      where: {
        pod_id: null,
        name,
      },
    });

    const plainService = serviceInDb.get({ plain: true });
    // Check if service already failed to start
    if (plainService.status === SERVICE_STATUS.LOADING) {
      logger.warn(`Service ${name} was not loaded at last startup, it will be avoid for now.`);
      return;
    }

    // Before starting service, set service status to loading
    let status = SERVICE_STATUS.LOADING;
    // Store service status
    serviceInDb.set({ status });
    await serviceInDb.save();

    try {
      await service.start();
      // Once service started, set service status to ready
      status = SERVICE_STATUS.READY;
    } catch (e) {
      // If service fails to start, set service status to error
      status = SERVICE_STATUS.ERROR;
      throw e;
    } finally {
      // Store service status
      serviceInDb.set({ status });
      await serviceInDb.save();
    }
  } catch (e) {
    if (e instanceof ServiceNotConfiguredError) {
      logger.info(`Service ${name} is not configured, so it was not started.`);
    } else {
      logger.warn(`Unable to start service ${name}`);
      logger.warn(e);
    }
  }
}

module.exports = {
  start,
};
