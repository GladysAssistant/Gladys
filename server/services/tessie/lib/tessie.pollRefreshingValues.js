const Promise = require('bluebird');
const { STATUS } = require('./utils/tessie.constants');
const logger = require('../../../utils/logger');

/**
 * @description Poll values of Tessie devices.
 * @example refreshNetatmoValues();
 */
async function refreshTessieValues() {
  logger.debug('Looking for Tessie devices values...');
  await this.saveStatus({ statusType: STATUS.GET_DEVICES_VALUES, message: null });

  let devicesNetatmo = [];
  try {
    devicesNetatmo = await this.loadDevices();
  } catch (e) {
    await this.saveStatus({
      statusType: STATUS.ERROR.GET_DEVICES_VALUES,
      message: 'get_devices_value_fail',
    });
    logger.error('Unable to load Tessie devices', e);
  }
  await Promise.map(
    devicesNetatmo,
    async (device) => {
      const id = device.id || device._id;
      const externalId = `tessie:${id}`;
      const deviceExistInGladys = await this.gladys.stateManager.get('deviceByExternalId', externalId);
      if (deviceExistInGladys) {
        await this.updateValues(deviceExistInGladys, device, externalId);
      } else {
        logger.info(`device ${externalId} - ${device.type} does not exist in Gladys`);
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
  }, 120 * 1000);
}

module.exports = {
  pollRefreshingValues,
  refreshTessieValues,
};
