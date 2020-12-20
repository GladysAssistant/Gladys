const logger = require('../../../../utils/logger');

/**
 * @description Get Device.
 * @param {string} type - Netatmo Type of devices needed.
 * @returns {Array} Return array of devices.
 * @example
 * netatmo.getDevices(type);
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
  
  if (type === 'camera' || type === 'all') {
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
    });
  }

  if (type === 'valve' || type === 'room' || type === 'smokedetector' || type === 'all') {
    // on récupère les maisons du Netatmo Energy
    const promiseHomeData = new Promise((resolve, reject) => {
      this.api.homesData((err, data) => {
        resolve(data.homes);
      });
    });
    const homesEnergy = await promiseHomeData;
    homesEnergy.forEach(async (home) => {
      const options = {
        device: '',
        home_id: home.id,
      };
      const promiseHomeStatus = new Promise((resolve, reject) => {
        this.api.homeStatus(options, (err, data) => {
          resolve(data.home);
        });
      });
      const homeStatus = await promiseHomeStatus;
      
      /* const smokedetectors=[]; */
      const valves=[];
      home.modules.forEach((module) => {
        // on récupère la 1ère partie des détecteurs de fumée - pas de données intéressantes pour le moment - en attente maj API Netatmo car données disponible sur https://dev.netatmo.com/apidocumentation/energy
        /* if (module.type === 'NSD') {
          smokedetectors[smokedetectors.length+1] = [module];
        } */
        // puis on récupère la 1ère partie des vannes
        if (module.type === 'NRV') {
          valves[valves.length+1] = [module];
        }
      });
      homeStatus.modules.forEach((module) => {

        // puis on récupère la 2ème partie des détecteurs de fumée - pas de données intéressantes pour le moment - en attente maj API Netatmo car données disponible sur https://dev.netatmo.com/apidocumentation/energy
        /* if (module.type === 'NSD') {
          smokedetectors.forEach((smokedetector) => {
            if (smokedetector[0].id === module.id) {
              smokedetector[0]['homeStatus'] = module;
              this.newValueSmokeDetector(smokedetector[0]);
            }
          });
        } */

        // puis on récupère la 2ème partie des vannes
        if (module.type === 'NRV') {
          valves.forEach((valve) => {
            if (valve[0].id === module.id) {
              valve[0]['homeStatus'] = module;
            }
          });
        }
      });
      homeStatus.rooms.forEach((room) => {
        // puis on récupère la 3ème partie des vannes
        valves.forEach((valve) => {
          if (valve[0].room_id === room.id) {
            valve[0]['room'] = room;
            this.newValueValve(valve[0]);
          }
        });
      });
    });
  }

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
