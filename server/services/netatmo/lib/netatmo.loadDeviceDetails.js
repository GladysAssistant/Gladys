const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_MODULE_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud devices.
 * @param {object} homeData - House.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevicesDetails();
 */
async function loadDeviceDetails(homeData) {
  const homeId = homeData.id;
  logger.debug('loadDeviceDetails...', homeId);
  const paramsForm = {
    home_id: homeId,
  };
  try {
    const responseGetHomestatus = await axios({
      url: `${API.HOMESTATUS}`,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
      data: paramsForm,
    });
    const { body: bodyGetHomestatus, status: statusGetHomestatus } = responseGetHomestatus.data;
    const { rooms: roomsHomeData, modules: modulesHomeData } = homeData;
    const { rooms: roomsHomestatus, modules: modulesHomestatus } = bodyGetHomestatus.home;

    let thermostats;
    const modulesThermostat = [];
    if (
      modulesHomeData.find((moduleHomeData) => moduleHomeData.type === SUPPORTED_MODULE_TYPE.THERMOSTAT) !== undefined
    ) {
      try {
        logger.debug('loadDeviceDetails Thermostats...', homeId);
        const responseGetThermostat = await axios({
          url: API.GET_THERMOSTATS,
          method: 'get',
          headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
        });
        const { body: bodyGetThermostat, status: statusGetThermostat } = responseGetThermostat.data;
        thermostats = bodyGetThermostat.devices;
        if (statusGetThermostat === 'ok') {
          thermostats.forEach((thermostat) => {
            modulesThermostat.push(...thermostat.modules);
          });
        }
      } catch (e) {
        logger.info('e.statusGetThermostat: ', e.statusGetThermostat, 'e.data.error', e.response.data.error);
        return undefined;
      }
    }
    let listDevices;
    if (statusGetHomestatus === 'ok') {
      listDevices = modulesHomestatus
        ? (
            await Promise.all(
              modulesHomestatus.map(async (module) => {
                let moduleSupported = false;
                let deviceThermostat;
                let plugThermostat;
                switch (module.type) {
                  case SUPPORTED_MODULE_TYPE.THERMOSTAT:
                    moduleSupported = true;
                    if (thermostats && modulesThermostat) {
                      deviceThermostat = modulesThermostat.find(
                        // eslint-disable-next-line no-underscore-dangle
                        (moduleThermostat) => moduleThermostat._id === module.id,
                      );
                      plugThermostat = thermostats
                        .map((thermostat) => {
                          const { modules, ...rest } = thermostat;
                          return rest;
                        })
                        // eslint-disable-next-line no-underscore-dangle
                        .find((thermostat) => thermostat._id === module.bridge);
                    }
                    break;
                  case SUPPORTED_MODULE_TYPE.PLUG:
                    deviceThermostat = thermostats
                      .map((thermostat) => {
                        const { modules, ...rest } = thermostat;
                        return rest;
                      })
                      // eslint-disable-next-line no-underscore-dangle
                      .find((thermostat) => thermostat._id === module.id);
                    moduleSupported = true;
                    break;
                  default:
                    moduleSupported = false;
                    break;
                }
                if (moduleSupported) {
                  const moduleHomeData = modulesHomeData.find((mod) => mod.id === module.id);
                  const roomDevice = {
                    ...roomsHomeData.find((roomHomeData) => roomHomeData.id === moduleHomeData.room_id),
                    ...roomsHomestatus.find((room) => room.id === moduleHomeData.room_id),
                  };
                  const plugDevice = {
                    ...modulesHomeData.find((mod) => mod.id === module.bridge),
                    ...modulesHomestatus.find((modulePlug) => modulePlug.id === module.bridge),
                    ...plugThermostat,
                  };
                  const plug = Object.keys(plugDevice).length === 0 ? undefined : plugDevice;
                  const deviceSupported = {
                    ...module,
                    ...moduleHomeData,
                    ...deviceThermostat,
                    home: homeId,
                    room: roomDevice,
                    plug,
                  };
                  return deviceSupported;
                }
                return undefined;
              }),
            )
          ).filter((item) => item !== undefined)
        : undefined;
      logger.info('listDevices load: ', listDevices.length);
    } else {
      logger.warn('Status load devices not ok: ', statusGetHomestatus);
    }
    return listDevices;
  } catch (e) {
    logger.error('e: ', e);
    // logger.error('e.statusGetHomestatus: ', e.statusGetHomestatus, 'e.data.error', e.response.data.error);
    return undefined;
  }
}

module.exports = {
  loadDeviceDetails,
};
