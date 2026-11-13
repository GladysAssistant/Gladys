const db = require('../../models');
const { SERVICE_TYPES } = require('../../utils/constants');

/**
 * @description Get all external integrations, with the "update available" flag,
 * the latest version known for each of them and, when that version requires
 * a Gladys the running one does not satisfy, its `gladys_version` range.
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
      update_requires_gladys_version: this.getRequiredGladysVersion(plainService),
    };
  });
}

module.exports = {
  get,
};
