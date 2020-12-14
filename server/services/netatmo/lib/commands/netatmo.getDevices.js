const logger = require('../../../../utils/logger');
/**
 * @description Get Device.
 * @returns {Array} Return array of devices.
 * @example
 * netatmo.getDevices();
 */
async function getDevices() {
  // on recupere le thermostat
  const promiseThermostat = new Promise((resolve, reject) => {
    this.api.getThermostatsData((err, sensors) => {
      resolve(sensors);
    });
  });
  const sensors = await promiseThermostat;
  sensors.forEach((sensor) => {
    sensor.modules.forEach((module) => {
      if (module.type === 'NATherm1') {
        this.newValueThermostat(module);
      } else {
        logger.info(module);
      }
    });
  });
  // on recupere l id de la maison
  const promiseGetHomeData = new Promise((resolve, reject) => {
    this.api.getHomeData((err, data) => {
      resolve(data.homes[0]);
    });
  });
  const homes = await promiseGetHomeData;
  // on recupere les cameras
  if (homes.cameras) {
    homes.cameras.forEach((camera) => {
      this.newValueCamera(camera);
    });
  };

  // Recuperer la station
  const promiseGetStationsData = new Promise((resolve, reject) => {
    this.api.getStationsData((err, data) => {
      resolve(data);
    });
  });
  const stations = await promiseGetStationsData;
  stations.forEach((station) => {
    this.newValueStation(station);
  });
}

module.exports = {
    getDevices,
};
