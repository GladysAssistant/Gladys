const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { SERVICE_TYPES } = require('../../utils/constants');

/**
 * @description Get one external integration by selector.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with the external integration service.
 * @example
 * const integration = await gladys.externalIntegration.getBySelector('ext-dev-my-integration');
 */
async function getBySelector(selector) {
  const service = await db.Service.findOne({
    where: {
      selector,
      type: SERVICE_TYPES.EXTERNAL,
      pod_id: null,
    },
  });
  if (service === null) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_NOT_FOUND');
  }
  return service.get({ plain: true });
}

module.exports = {
  getBySelector,
};
