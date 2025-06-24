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
 * @description Poll values of Tessie devices with dynamic interval.
 * @param {number} interval - Polling interval in milliseconds.
 * @example pollRefreshingValues(60000);
 */
function pollRefreshingValues(interval = 60 * 1000) {
  // Arrêter le polling existant s'il y en a un
  if (this.pollRefreshValues) {
    clearInterval(this.pollRefreshValues);
  }

  this.pollRefreshValues = setInterval(async () => {
    try {
      await refreshTessieValues.call(this);
      // Vérifier l'état du véhicule après chaque refresh pour ajuster l'intervalle
      await adjustPollingInterval.call(this);
    } catch (error) {
      logger.error('Error refreshing Tessie values: ', error);
    }
  }, interval);

  logger.debug(`Polling started with interval: ${interval}ms`);
}

/**
 * @description Start polling with initial interval and dynamic adjustment.
 * @example startPolling();
 */
async function startPolling() {
  // Démarrer avec l'intervalle par défaut (60s)
  pollRefreshingValues.call(this, 10 * 1000);
}

/**
 * @description Adjust polling interval based on vehicle state.
 * @example adjustPollingInterval();
 */
async function adjustPollingInterval() {
  const fastInterval = 5 * 1000; // 5 secondes
  const normalInterval = 5 * 60 * 1000; // 60 secondes
  console.log('this.stateVehicle', this.stateVehicle);
  // Vérifier si le véhicule est en train de charger ou de conduire
  if (this.stateVehicle === STATUS.VEHICLE_STATE.CHARGING ||
    this.stateVehicle === STATUS.VEHICLE_STATE.DRIVING && !this.configuration.websocketEnabled) {
    // Si on n'est pas déjà en mode rapide, redémarrer avec l'intervalle rapide et si websocket est désactivé
    if (this.currentPollingInterval !== fastInterval) {
      logger.debug(`Vehicle state changed to ${this.stateVehicle}, switching to fast polling (5s)`);
      this.currentPollingInterval = fastInterval;
      pollRefreshingValues.call(this, fastInterval);
    }
  } else {
    // Si on n'est pas déjà en mode normal, redémarrer avec l'intervalle normal
    if (this.currentPollingInterval !== normalInterval) {
      logger.debug(`Vehicle state changed to ${this.stateVehicle}, switching to normal polling (60s)`);
      this.currentPollingInterval = normalInterval;
      pollRefreshingValues.call(this, normalInterval);
    }
  }
}

module.exports = {
  refreshTessieValues,
  startPolling,
};
