const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const v2 = require('./ewelink.v2');
const v3 = require('./ewelink.v3');
const { CONFIGURATION_KEYS } = require('../utils/constants');

const VERSIONS = [v2, v3];

/**
 * @description Upgrades eWeLink integration to last version.
 * @example
 * await this.upgrade();
 */
async function upgrade() {
  const storedVersion = await this.gladys.variable.getValue(CONFIGURATION_KEYS.SERVICE_VERSION, this.serviceId);
  const currentVersion = storedVersion ? Number.parseInt(storedVersion, 10) : 0;

  logger.info('eWeLink: service is currently on version %s...', currentVersion);

  // Versions to apply
  const toApply = VERSIONS.filter((version) => currentVersion < version.VERSION_NUMBER);

  await Promise.each(toApply, async (version) => {
    const { VERSION_NUMBER, apply } = version;
    logger.info('eWeLink: upgrading service to version %d...', VERSION_NUMBER);
    await apply(this);
    await this.gladys.variable.setValue(CONFIGURATION_KEYS.SERVICE_VERSION, `${VERSION_NUMBER}`, this.serviceId);
    logger.info('eWeLink: service well upgraded to version %d', VERSION_NUMBER);
  });
}

module.exports = {
  upgrade,
};
