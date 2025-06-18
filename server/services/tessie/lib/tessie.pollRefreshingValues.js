const Promise = require('bluebird');
const { STATUS } = require('./utils/tessie.constants');
const logger = require('../../../utils/logger');

/**
 * @description Poll values of Tessie devices.
 * @example refreshTessieValues();
 */
async function refreshTessieValues() {
  logger.debug('Looking for Tessie devices values...');
  await this.saveStatus({ statusType: STATUS.GET_DEVICES_VALUES, message: null });

  let devicesTessie = [];
  try {
    devicesTessie = await this.loadVehicles();
  } catch (e) {
    await this.saveStatus({
      statusType: STATUS.ERROR.GET_DEVICES_VALUES,
      message: 'get_devices_value_fail',
    });
    logger.error('Unable to load Tessie devices', e);
  }
  await Promise.map(
    devicesTessie,
    async (device) => {
      const externalId = `tessie:${device.vin}`;
      const deviceExistInGladys = await this.gladys.stateManager.get('deviceByExternalId', externalId);
      if (deviceExistInGladys) {
        await this.updateValues(deviceExistInGladys, device, externalId, device.vin);
      } else {
        logger.info(`device ${externalId} does not exist in Gladys`);
      }
    },
    { concurrency: 2 },
  );
  await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
}

/**
 * @description Poll values of Tessie devices.
 * @example pollRefreshingValues();
 */
function pollRefreshingValues() {
  this.pollRefreshValues = setInterval(async () => {
    try {
      await this.refreshTessieValues();
    } catch (error) {
      logger.error('Error refreshing Tessie values: ', error);
    }
  }, 30 * 1000);
}

module.exports = {
  pollRefreshingValues,
  refreshTessieValues,
};
