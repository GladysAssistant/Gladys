const logger = require('../../../../utils/logger');

/**
 * @description Upgrades integration to v2.
 * @param {object} ewelink - Current eWeLink service handler.
 * @example
 * await v2.apply();
 */
async function apply(ewelink) {
  logger.info('eWeLink: removing EMAIL/PASSWORD/REGION variables from database...');
  const { serviceId, gladys } = ewelink;
  await gladys.variable.destroy('EWELINK_EMAIL', serviceId);
  await gladys.variable.destroy('EWELINK_PASSWORD', serviceId);
  await gladys.variable.destroy('EWELINK_REGION', serviceId);
}

module.exports = {
  apply,
  VERSION_NUMBER: 2,
};
