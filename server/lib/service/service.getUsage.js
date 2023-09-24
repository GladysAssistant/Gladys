const Promise = require('bluebird');
const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * @public
 * @description Get usage.
 * @param {string} [podId] - Id of the pod.
 * @returns {Promise<object>} Get all services used.
 * @example
 * const usage = await service.getUsage();
 * // {zigbee: true, xiaomi: false}
 */
async function getUsage(podId = null) {
  const services = await db.Service.findAll({
    where: {
      pod_id: podId,
    },
  });

  const serviceUsage = {};

  await Promise.mapSeries(services, async (serviceInDB) => {
    try {
      const service = this.getService(serviceInDB.name);
      if (service && service.isUsed) {
        const isServiceUsed = await service.isUsed();
        serviceUsage[serviceInDB.name] = isServiceUsed;
      }
    } catch (e) {
      logger.warn(`Unable to get service usage`, e);
    }
  });

  return serviceUsage;
}

module.exports = {
  getUsage,
};
