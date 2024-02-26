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
  let listDevices = [];

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
    const { body, status } = responseGetHomestatus.data;
    const { rooms: roomsHomestatus, modules: modulesHomestatus } = body.home;
    if (status === 'ok') {
      if (modulesHomestatus) {
        listDevices = modulesHomestatus.map((module) => {
          let moduleSupported = false;
          let apiNotConfigured = false;
          let categoryAPI = SUPPORTED_CATEGORY_TYPE.UNKNOWN;
          const { type: model } = module;
          if (
            model === SUPPORTED_MODULE_TYPE.THERMOSTAT ||
            model === SUPPORTED_MODULE_TYPE.PLUG ||
            model === SUPPORTED_MODULE_TYPE.NRV
          ) {
            if (!this.configuration.energyApi) {
              apiNotConfigured = true;
            } else {
              apiNotConfigured = false;
            }
            moduleSupported = true;
            categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
          }
          if (
            model === SUPPORTED_MODULE_TYPE.NAMAIN ||
            model === SUPPORTED_MODULE_TYPE.NAMODULE1 ||
            model === SUPPORTED_MODULE_TYPE.NAMODULE2 ||
            model === SUPPORTED_MODULE_TYPE.NAMODULE3 ||
            model === SUPPORTED_MODULE_TYPE.NAMODULE4
          ) {
            if (!this.configuration.weatherApi) {
              apiNotConfigured = true;
            } else {
              apiNotConfigured = false;
            }
            moduleSupported = true;
            categoryAPI = SUPPORTED_CATEGORY_TYPE.WEATHER;
          }

          const moduleHomeData = modulesHomeData.find((mod) => mod.id === module.id);
          const roomDevice = {
            ...roomsHomeData.find((roomHomeData) => roomHomeData.id === moduleHomeData.room_id),
            ...roomsHomestatus.find((room) => room.id === moduleHomeData.room_id),
          };
          const plugDevice = {
            ...modulesHomeData.find((mod) => mod.id === module.bridge),
            ...modulesHomestatus.find((modulePlug) => modulePlug.id === module.bridge),
          };
          const plug = Object.keys(plugDevice).length === 0 ? undefined : plugDevice;
          const deviceSupported = {
            ...module,
            ...moduleHomeData,
            home: homeId,
            room: roomDevice,
            plug,
            categoryAPI,
            apiNotConfigured,
          };
          if (moduleSupported) {
            return deviceSupported;
          }
          return {
            ...deviceSupported,
            not_handled: true,
          };
        });
      } else {
        listDevices = undefined;
      }
      logger.debug('Devices details loaded in home: ', homeId);
    } else {
      logger.warn('Status load devices not ok: ', status, 'response: ', responseGetHomestatus);
    }
    return listDevices;
  } catch (e) {
    logger.error('Error getting devices details - error: ', e, ' - status error: ', e.status);
    return undefined;
  }
}

module.exports = {
  loadDeviceDetails,
};
