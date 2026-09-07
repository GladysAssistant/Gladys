const db = require('../../models');
const logger = require('../../utils/logger');
const { getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');

/**
 * @description Init devices in local RAM.
 * @param {boolean} startDuckDbMigration - Should start DuckDB migration.
 * @returns {Promise} Resolve with inserted devices.
 * @example
 * gladys.device.init();
 */
async function init(startDuckDbMigration = true) {
  // load all devices in RAM
  const devices = await db.Device.findAll({
    include: getStandardDeviceIncludes(),
  });
  logger.debug(`Device : init : Found ${devices.length} devices`);
  const plainDevices = devices.map((device) => {
    const plainDevice = device.get({ plain: true });
    this.add(plainDevice);
    return plainDevice;
  });
  // polling is not setup here: it is started by the boot sequence, once
  // every service is started (see lib/index.js), so that a poll never hits
  // an integration which is not started yet
  if (startDuckDbMigration) {
    this.migrateFromSQLiteToDuckDb();
    // One-shot background cleanup, no-op once its system variable is set
    this.purgeOrphanedDuckDbStates();
  }
  return plainDevices;
}

module.exports = {
  init,
};
