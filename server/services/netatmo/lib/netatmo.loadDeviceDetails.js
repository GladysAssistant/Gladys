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
    const { body, status } = responseGetHomestatus.data;
    const { rooms: roomsHomestatus, modules: modulesHomestatus } = body.home;
    let listDevices = [];
    if (status === 'ok') {
      if (modulesHomestatus) {
        listDevices = modulesHomestatus
          .map((module) => {
            let moduleSupported = false;
            let categoryAPI;
            switch (module.type) {
              case SUPPORTED_MODULE_TYPE.THERMOSTAT:
                moduleSupported = true;
                categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
                break;
              case SUPPORTED_MODULE_TYPE.PLUG:
                moduleSupported = true;
                categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
                break;
              case SUPPORTED_MODULE_TYPE.NAMAIN:
                moduleSupported = true;
                categoryAPI = SUPPORTED_CATEGORY_TYPE.WEATHER;
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
            };
            const plug = Object.keys(plugDevice).length === 0 ? undefined : plugDevice;
            if (moduleSupported) {
              return {
                ...module,
                ...moduleHomeData,
                home: homeId,
                room: roomDevice,
                plug,
                categoryAPI,
              };
            }
            return {
              ...module,
              ...moduleHomeData,
              home: homeId,
              room: roomDevice,
              plug,
              not_handled: true,
            };
          })
          .filter((item) => item !== undefined);
      } else {
        listDevices = undefined;
      }
      logger.debug('Devices details loaded in home: ', homeId);
    } else {
      logger.warn('Status load devices not ok: ', status);
    }
    return listDevices;
  } catch (e) {
    logger.error('Error getting devices details - error: ', e);
    return undefined;
  }
}

module.exports = {
  loadDeviceDetails,
};
