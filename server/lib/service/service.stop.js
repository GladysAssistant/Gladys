const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const db = require('../../models');

/**
 * @public
 * @description Stops one service by name.
 * @param {string} name - The name of the service.
 * @param {string} podId - ID of Gladys instance.
 * @param {boolean} userAction - Manually stopped?
 * @returns {Promise<object>} Requested service.
 * @example
 * service.stop('telegram');
 */
async function stop(name, podId = null, userAction = false) {
  // Load service from DB
  const serviceInDb = await db.Service.findOne({
    where: {
      pod_id: podId,
      name,
    },
  });

  try {
    const service = this.getService(name);

    let status;
    try {
      await service.stop();
    } finally {
      // Once service manually stopped, set service status to stopped
      if (userAction) {
        status = SERVICE_STATUS.STOPPED;
        // Store service status
        serviceInDb.set({ status });
        await serviceInDb.save();
      }
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
