const logger = require('../../../../utils/logger');

/**
 * @description  Update value of Netatmo devices.
 * @param {string} typeUpdate - Data Type update.
 * @example
 * updateNetatmo('Security-devices-update');
 */
async function updateNetatmo(typeUpdate) {
  Object.keys(this.devices).forEach(async (key) => {
    let deviceExternalId;
    if (this.devices[key].id !== undefined) {
      deviceExternalId = `netatmo:${this.devices[key].id}`;
    } else {
      /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
      deviceExternalId = `netatmo:${this.devices[key]._id}`;
    }
    const deviceSelector = deviceExternalId.replace(/:/gi, '-');
    let device;
    try {
      device = this.gladys.device.getBySelector(deviceSelector);
    } catch (e) {
      if (this.devices[key].name !== undefined) {
        logger.debug(
          `Netatmo : File netatmo.updateNetatmo.js - device netatmo ${this.devices[key].type} ${this.devices[key].name} no save in DB - error : ${e}`,
        );
      } else {
        logger.debug(
          `Netatmo : File netatmo.updateNetatmo.js - device netatmo ${this.devices[key].type} ${this.devices[key].station_name} no save in DB - error : ${e}`,
        );
      }
    }

    if (
      (typeUpdate === 'All' || typeUpdate === 'Security') &&
      (this.devices[key].type === 'NACamera' || this.devices[key].type === 'NOC')
    ) {
      // we save the data of cameras
      await this.updateCamera(key, device, deviceSelector);
    } else if (
      (typeUpdate === 'All' || typeUpdate === 'Energy') &&
      (this.devices[key].type === 'NATherm1' || this.devices[key].type === 'NRV') &&
      device !== undefined
    ) {
      // we save the common data of thermostats and valves
      await this.updateThermostat(key, device, deviceSelector);
    } else if (
      (typeUpdate === 'All' || typeUpdate === 'HomeCoach_Weather') &&
      (this.devices[key].type === 'NHC' || this.devices[key].type === 'NAMain')
    ) {
      if (device !== undefined) {
        // we save the common data of home coaches and weather stations
        await this.updateHomeCoachWeather(key, device, deviceSelector);

        if (this.devices[key].type === 'NHC') {
          // we save other home coach data
          await this.updateNHC(key, device, deviceSelector);
        }
      }
      if (this.devices[key].type === 'NAMain') {
        // we save the other weather station data
        await this.updateWeatherStation(key, device, deviceSelector);
      }
    }
  });
}

module.exports = {
  updateNetatmo,
};
