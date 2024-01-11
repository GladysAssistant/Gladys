const { STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');
const { updateValues } = require('./netatmo.saveValue');

/**
 *
 * @description Poll values of Netatmo devices.
 * @example
 * refreshNetatmoValues();
 */
async function refreshNetatmoValues() {
  logger.debug('Looking for Netatmo devices values...');
  this.saveStatus({ statusType: STATUS.GET_DEVICES_VALUES, message: null });

  let devicesNetatmo = [];
  try {
    devicesNetatmo = await this.loadDevices();
  } catch (e) {
    this.saveStatus({
      statusType: STATUS.ERROR.GET_DEVICES_VALUES,
      message: 'get_devices_value_fail',
    });
    logger.error('Unable to load Netatmo devices', e);
  }
  devicesNetatmo.map(async (device) => {
    const externalId = `netatmo:${device.id}`;
    const deviceExistInGladys = await this.gladys.stateManager.get('deviceByExternalId', externalId);
    if (deviceExistInGladys) {
      await updateValues(deviceExistInGladys, device, externalId);
    } else {
      logger.info(`device ${externalId} - ${device.type} does not exist in Gladys`);
    }
  });
  this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
}

/**
 *
 * @description Poll values of Netatmo devices.
 * @example
 * pollRefreshingValues();
 */
function pollRefreshingValues() {
  refreshNetatmoValues();
  this.pollRefreshValues = setInterval(() => refreshNetatmoValues(), 120 * 1000);
}

module.exports = {
  pollRefreshingValues,
};
