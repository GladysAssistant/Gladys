const { CONFIGURATION } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Get Device.
 * @example
 * netatmo.getDevices();
 */
async function getDevices() {
  // on recupere le thermostat
  let promise = new Promise((resolve, reject) => {
    this.api.getThermostatsData(function(err, sensors) {
      resolve(sensors)
    });
  });
  let sensors = await promise;
  for (let sensor of sensors) {
    for (let element of sensor.modules) {
      if (element.type == "NATherm1") {
        this.newValueThermostat(element)
      } else {
        console.log(element)
      }
    }
  };
  // on recupere l id de la maison
  let promise2 = new Promise((resolve, reject) => {
    this.api.getHomeData(function(err, data) {
      resolve(data.homes[0].id)
    })
  })
  let idHome = await promise2;
  // on recuepre les tete thermostatique
  var options = {
    home_id: idHome
  }
  promise = new Promise((resolve, reject) => {
    this.api.getHomeStatus(options, function(err, data) {
      resolve(data.home)
    })
  })
  sensors = await promise;
  console.log(sensors)


  // Recuperer la station
  promise = new Promise((resolve, reject) => {
    this.api.getStationsData(function(err, data) {
      resolve(data)
    })
  })
  stations = await promise;
  for (let station of stations) {
    this.newValueStation(station)
  }
}

module.exports = {
    getDevices,
};
