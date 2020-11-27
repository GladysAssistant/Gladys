const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const db = require('../../models');

/**
 * @public
 * @description Stops one service by name
 * @param {string} name - The name of the service.
 * @param {string} pod_id - ID of Gladys instance.
 * @returns {Promise<Object>} Requested service.
 * @example
 * service.stop('telegram');
 */
async function stop(name, pod_id = null) {
  // Load service from DB
  const serviceInDb = await db.Service.findOne({
    where: {
      pod_id,
      name,
    },
  });

  try {
    const service = this.getService(name);

    let status;
    try {
      await service.stop();
      // Once service started, set service status to stopped
      status = SERVICE_STATUS.STOPPED;
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
    logger.warn(`Unable to stop service ${name}`, e);
  }

  if (!serviceInDb) {
    return null;
  }

  return serviceInDb.get({ plain: true });
}

module.exports = {
  stop,
};
