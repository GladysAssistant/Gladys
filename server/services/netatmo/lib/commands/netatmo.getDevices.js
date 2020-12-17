const logger = require('../../../../utils/logger');

/**
 * @description Get Device.
 * @returns {Array} Return array of devices.
 * @example
 * netatmo.getDevices();
 */
async function getDevices(type) {  
  if (type === 'thermostat' || type === 'all') {
    // on récupère les thermostats
    const promiseThermostat = new Promise((resolve, reject) => {
      this.api.getThermostatsData((err, sensors) => {
        resolve(sensors);
      });
    });
    const sensors = await promiseThermostat;
    sensors.forEach((sensor) => {
      sensor.modules.forEach((module) => {
        if (module.type === 'NATherm1') {
          // note: "boiler_status": true  = Demande de chauffe = Allumage chaudière 
          this.newValueThermostat(module);
        } else {
          logger.info(module);
        }
      });
    });
  }
  
  if (type === 'camera' || type === 'smokedetector' || type === 'all') {
    // on récupère les maisons du Netatmo Security
    const promiseGetHomeData = new Promise((resolve, reject) => {
      this.api.getHomeData((err, data) => {
        resolve(data.homes);
      });
    });
    const homes = await promiseGetHomeData;
    homes.forEach((home) => {
      // puis on récupère les caméras
      home.cameras.forEach((camera) => {
        this.newValueCamera(camera);
      });
      // puis on récupère les détecteurs de fumée
      home.smokedetectors.forEach((smokedetector) => {
        this.newValueSmokeDetector(smokedetector);
      });
    });
  }



/*
  // on récupère les maisons du Netatmo Energy
  const promiseHomeData = new Promise((resolve, reject) => {
    this.api.homesData((err, data) => {
      resolve(data.homes);
    });
  });
  const homesEnergy = await promiseHomeData;
  homes.forEach(async (home) => {
    const options = {
      device:'',
      home_id: homesEnergy.id
    };
    const promiseHomeStatus = new Promise((resolve, reject) => {
      this.api.homesStatus(options, (err, data) => {
        resolve(data.home);
      });
    });
    const homeStatus = await promiseHomeStatus;
    home.rooms.forEach((room) => {
      const list = [];
      const room_id = room.id;
      room.module_ids.forEach((module_ids) => {
        homeStatus.rooms.forEach((room) => {
          list.push(obj[key]);
      });
      this.newValueValve(room_id);
    });
    // puis on récupère les pièces équipées de vannes
    home.cameras.forEach((camera) => {
      this.newValueCamera(camera);
    });
    // puis on récupère les vannes des pièces
    home.smokedetectors.forEach((smokedetector) => {
      this.newValueSmokeDetectors(smokedetector);
    });
  });
*/


  if (type === 'station' || type === 'all') {
    // on récupère les stations
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
  
  if (type === 'homecoach' || type === 'all') {
    // on récupère les homeCoachs
    const promiseGetHomecoachsData = new Promise((resolve, reject) => {
      this.api.getHealthyHomeCoachData((err, data) => {
        resolve(data);
      });
    });
    const homecoachs = await promiseGetHomecoachsData;
    homecoachs.forEach((homecoach) => {
      this.newValueHomeCoach(homecoach);
    });
  }
}

module.exports = {
  getDevices,
};
