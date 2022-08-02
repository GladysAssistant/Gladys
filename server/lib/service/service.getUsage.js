const Promise = require('bluebird');
const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * @public
 * @description Get usage
 * @param {string} [pod_id] - Id of the pod.
 * @returns {Promise<Object>} Get all services used.
 * @example
 * const usage = await service.getUsage();
 * // {zigbee: true, xiaomi: false}
 */
async function getUsage(pod_id = null) {
  const services = await db.Service.findAll({
    where: {
      pod_id,
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
