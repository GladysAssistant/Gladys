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
  // setup polling for device who need polling
  this.setupPoll();
  if (startDuckDbMigration) {
    this.migrateFromSQLiteToDuckDb();
  }
  return plainDevices;
}

module.exports = {
  init,
};
