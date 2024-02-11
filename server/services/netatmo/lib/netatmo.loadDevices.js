const Promise = require('bluebird');
const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_MODULE_TYPE, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud devices.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices() {
  try {
    let listDevices = [];

    if (this.configuration.energyApi) {
      logger.error('globalApi')
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
            if (modules) {
              return this.loadDeviceDetails(home);
            }
            return undefined;
          },
          { concurrency: 2 },
        );
        listDevices = results.filter((device) => device !== undefined).flat();
      }
    }

    if (this.configuration.energyApi) {
      const { plugs, thermostats } = await this.loadThermostatDetails();
      if (listDevices.length > 0) {
        // we add the properties of the "getThermostats" API request to those of the previous "Energy" API request
        listDevices = listDevices.map(device => {
          const plug = plugs.find(plug => plug._id === device.id);
          if (plug) {
            return { ...device, ...plug };
          }
          const thermostat = thermostats.find(modulePlug => modulePlug._id === device.id);
          if (thermostat) {
            const plugThermostat = plugs
              .map((thermostat) => {
                const { modules, ...rest } = thermostat;
                return rest;
              })
              // eslint-disable-next-line no-underscore-dangle
              .find((plug) => plug._id === device.bridge);
            device.plug = {
              ...device.plug,
              ...plugThermostat,
            }
            return { ...device, ...thermostat };
          }
          return device;
        });
        // then we add the plugs and thermostats that would belong to a house that does not have devices in the "Energy" category
        listDevices = [...listDevices, ...plugs.filter(
          plug => !listDevices.some(device => device.id === plug._id)
        ), ...thermostats.filter(
          thermostat => !listDevices.some(device => device.id === thermostat._id)
        )];
      } else {
        // otherwise we retrieve the plugs and thermostats as the "getThermostats" API request provides them to us
        listDevices = [...plugs, ...thermostats];
      }
      listDevices
        .filter(device => device.type === SUPPORTED_MODULE_TYPE.PLUG)
        .forEach((plug) => {
          if (!plug.modules_bridged) {
            plug.modules_bridged = plug.modules.map(module => module._id);
          }
        });
    }

    if (this.configuration.weatherApi) {
      const { weatherStations } = await this.loadWeatherStationDetails();
      if (listDevices.length > 0) {
        // we add the properties of the "Weather" API request to those of the previous "Energy" API request
        listDevices = listDevices.map(device => {
          const weatherStation = weatherStations.find(station => station._id === device.id);
          if (weatherStation) {
            return { ...device, ...weatherStation };
          }
          return device;
        });
        // then we add the weather stations that would belong to a house that does not have devices in the "Energy" category
        listDevices = [...listDevices, ...weatherStations.filter(
          station => !listDevices.some(device => device.id === station._id)
        )];
      } else {
        // otherwise we retrieve the weather stations as the "Weather" API request provides them to us
        listDevices = [...weatherStations];
      }
      listDevices
        .filter(device => device.type === SUPPORTED_MODULE_TYPE.NAMAIN)
        .forEach((weatherStation) => {
          if (!weatherStation.modules_bridged) {
            weatherStation.modules_bridged = weatherStation.modules.map(module => module._id);
          }
        });
    }

    logger.debug(`${listDevices.length} Netatmo devices loaded`);
    logger.info(`Netatmo devices not supported : ${listDevices.filter((device) => device.not_handled).length}`);
    return listDevices;
  } catch (e) {
    logger.error('e.status: ', e.status, 'e', e);
    return undefined;
  }
}

module.exports = {
  loadDevices,
};
