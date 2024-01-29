const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_MODULE_TYPE, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud devices.
 * @param {object} homeData - House.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevicesDetails();
 */
async function loadDeviceDetails(homeData) {
  const { rooms: roomsHomeData, modules: modulesHomeData, id: homeId } = homeData;

  logger.debug('loading devices details in home id: ', homeId, '...');
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
    const { rooms: roomsHomestatus, modules: modulesHomestatus } = bodyGetHomestatus.home;
    let listDevices = [];
    if (statusGetHomestatus === 'ok') {
      let thermostats;
      let modulesThermostat = [];
      if (
        modulesHomeData.find((moduleHomeData) => moduleHomeData.type === SUPPORTED_MODULE_TYPE.THERMOSTAT) !== undefined
      ) {
        const deviceThermostats = await this.loadThermostatDetails();
        thermostats = deviceThermostats.thermostats;
        modulesThermostat = deviceThermostats.modules;
      }
      if (modulesHomestatus) {
        listDevices = modulesHomestatus
          .map((module) => {
            let moduleSupported = false;
            let categoryAPI;
            let device;
            let plugThermostat;
            switch (module.type) {
              case SUPPORTED_MODULE_TYPE.THERMOSTAT:
                moduleSupported = true;
                if (thermostats && modulesThermostat) {
                  device = modulesThermostat.find(
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
                categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
                break;
              case SUPPORTED_MODULE_TYPE.PLUG:
                if (thermostats) {
                  device = thermostats
                    .map((thermostat) => {
                      const { modules, ...rest } = thermostat;
                      return rest;
                    })
                    // eslint-disable-next-line no-underscore-dangle
                    .find((thermostat) => thermostat._id === module.id);
                }
                moduleSupported = true;
                categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
                break;
              default:
                moduleSupported = false;
                break;
            }
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
            if (moduleSupported) {
              const deviceSupported = {
                ...module,
                ...moduleHomeData,
                ...device,
                home: homeId,
                room: roomDevice,
                plug,
                categoryAPI,
              };
              return deviceSupported;
            }
            const deviceNotSupported = {
              ...module,
              ...moduleHomeData,
              ...device,
              home: homeId,
              room: roomDevice,
              plug,
              not_handled: true,
            };
            return deviceNotSupported;
          })
          .filter((item) => item !== undefined);
      } else {
        listDevices = undefined;
      }
      logger.debug('Devices details loaded in home: ', homeId);
    } else {
      logger.warn('Status load devices not ok: ', statusGetHomestatus);
    }
    return listDevices;
  } catch (e) {
    logger.error(
      'Error getting devices details - error: ',
      e,
      ' - status error: ',
      e.status,
      ' data error: ',
      e.response.data.error,
    );
    return undefined;
  }
}

module.exports = {
  loadDeviceDetails,
};
