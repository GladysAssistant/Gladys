const db = require('../../models');
const { SERVICE_TYPES } = require('../../utils/constants');

/**
 * @description Get all external integrations, with the "update available" flag
 * and the latest version known for each of them.
 * @returns {Promise<Array>} Resolve with the list of external integrations.
 * @example
 * const integrations = await gladys.externalIntegration.get();
 */
async function get() {
  const services = await db.Service.findAll({
    where: {
      type: SERVICE_TYPES.EXTERNAL,
      pod_id: null,
    },
    order: [['name', 'ASC']],
  });
  return services.map((service) => {
    const plainService = service.get({ plain: true });
    return {
      ...plainService,
      update_available: this.isUpdateAvailable(plainService),
      latest_version: this.getLatestVersion(plainService),
    };
  });
}

module.exports = {
  get,
};
