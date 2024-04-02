const Promise = require('bluebird');
const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_MODULE_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud devices.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices() {
  let listDevices = [];

  if (this.configuration.energyApi || (!this.configuration.energyApi && !this.configuration.weatherApi)) {
    try {
      const responsePage = await axios({
        url: API.HOMESDATA,
        method: 'get',
        headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
      });
      const { body, status } = responsePage.data;
      const { homes } = body;
      if (status === 'ok') {
        const results = await Promise.map(
          homes,
          async (home) => {
            const { modules } = home;
            if (modules && modules.length > 0) {
              return this.loadDeviceDetails(home);
            }
            return undefined;
          },
          { concurrency: 2 },
        );
        listDevices = results.filter((device) => device !== undefined).flat();
      }
    } catch (e) {
      logger.error('Error request ', API.HOMESDATA, ' - e.status: ', e.status, 'e', e);
    }
  }

  if (this.configuration.energyApi || (!this.configuration.energyApi && !this.configuration.weatherApi)) {
    try {
      const { plugs, thermostats } = await this.loadThermostatDetails();
      if (listDevices.length > 0) {
        /* we add the properties of the "Weather" API request to those of the previous "Energy" API request */
        const listDeviceIds = listDevices.map((device) => device._id || device.id);
        listDevices = listDeviceIds.map((id) => {
          let deviceList = listDevices.find((device) => device._id === id || device.id === id);
          const plugEnergy = plugs.find((plug) => plug._id === id);
          const thermostat = thermostats.find((t) => t._id === id);
          if (plugEnergy) {
            deviceList = { ...deviceList, ...plugEnergy };
          }
          if (thermostat) {
            const plugThermostat = plugs
              .map((plug) => {
                const { modules, ...rest } = plug;
                return rest;
              })
              .find((plug) => plug._id === deviceList.bridge);

            deviceList.plug = { ...deviceList.plug, ...plugThermostat };
            deviceList = { ...deviceList, ...thermostat };
          }

          return deviceList;
        });
        /* then we add the plugs and thermostats that would belong to a house 
        that does not have devices in the "Energy" category */
        listDevices = [
          ...listDevices,
          ...plugs.filter((plug) => !listDevices.some((device) => device.id === plug._id)),
          ...thermostats.filter((thermostat) => !listDevices.some((device) => device.id === thermostat._id)),
        ];
      } else {
        /* otherwise we retrieve the plugs and thermostats as the "getThermostats" API request provides them to us */
        listDevices = [...plugs, ...thermostats];
      }
      listDevices
        .filter((device) => device.type === SUPPORTED_MODULE_TYPE.PLUG)
        .forEach((plug) => {
          if (!plug.modules_bridged) {
            plug.modules_bridged = plug.modules.map((module) => module._id);
          }
        });
    } catch (e) {
      logger.error('Error on loadThermostatDetails - e.status: ', e.status, 'e', e);
    }
  }

  if (this.configuration.weatherApi || (!this.configuration.energyApi && !this.configuration.weatherApi)) {
    try {
      const { weatherStations, modulesWeatherStations } = await this.loadWeatherStationDetails();
      if (listDevices.length > 0) {
        /* we add the properties of the "Weather" API request to those of the previous "Energy" API request */
        listDevices = listDevices.map((device) => {
          const weatherStation = weatherStations.find((station) => station._id === device.id);
          if (weatherStation) {
            return { ...device, ...weatherStation };
          }
          const moduleWeatherStation = modulesWeatherStations.find(
            (modWeatherStation) => modWeatherStation._id === device.id,
          );
          if (moduleWeatherStation) {
            const plugModuleWeatherStation = weatherStations
              .map((weatherStationModules) => {
                const { modules, ...rest } = weatherStationModules;
                return rest;
              })
              .find((plug) => plug._id === device.bridge);
            device.plug = {
              ...device.plug,
              ...plugModuleWeatherStation,
            };
            return { ...device, ...moduleWeatherStation };
          }
          return device;
        });
        /* then we add the weather stations that would belong to a house 
        that does not have devices in the "Energy" category */
        listDevices = [
          ...listDevices,
          ...weatherStations.filter((station) => !listDevices.some((device) => device.id === station._id)),
          ...modulesWeatherStations.filter(
            (moduleStation) => !listDevices.some((device) => device.id === moduleStation._id),
          ),
        ];
      } else {
        /* otherwise we retrieve the plugs and thermostats as the "getThermostats" API request provides them to us */
        listDevices = [...weatherStations, ...modulesWeatherStations];
      }
      listDevices
        .filter((device) => device.type === SUPPORTED_MODULE_TYPE.NAMAIN)
        .forEach((weatherStation) => {
          if (!weatherStation.modules_bridged) {
            weatherStation.modules_bridged = weatherStation.modules.map((module) => module._id);
          }
        });
    } catch (e) {
      logger.error('Error on loadWeatherStationDetails - e.status: ', e.status, 'e', e);
    }
  }
  logger.debug(`${listDevices.length} Netatmo devices loaded`);
  logger.info(`Netatmo devices not supported : ${listDevices.filter((device) => device.not_handled).length}`);
  return listDevices;
}

module.exports = {
  loadDevices,
};
