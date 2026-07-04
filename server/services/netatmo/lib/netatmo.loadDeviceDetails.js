const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_MODULE_TYPE, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

const ENERGY_MODULE_TYPES = [SUPPORTED_MODULE_TYPE.THERMOSTAT, SUPPORTED_MODULE_TYPE.PLUG, SUPPORTED_MODULE_TYPE.NRV];
const WEATHER_MODULE_TYPES = [
  SUPPORTED_MODULE_TYPE.NAMAIN,
  SUPPORTED_MODULE_TYPE.NAMODULE1,
  SUPPORTED_MODULE_TYPE.NAMODULE2,
  SUPPORTED_MODULE_TYPE.NAMODULE3,
  SUPPORTED_MODULE_TYPE.NAMODULE4,
];
const SECURITY_MODULE_TYPES = [SUPPORTED_MODULE_TYPE.NACAMERA, SUPPORTED_MODULE_TYPE.NOC];

/**
 * @description Resolve support flags and API category of a Netatmo module type.
 * @param {string} model - Netatmo module type.
 * @param {object} configuration - Netatmo service configuration.
 * @returns {object} Module support flag, API category and configuration flag.
 * @example
 * getModuleCategory('NRV', this.configuration);
 */
function getModuleCategory(model, configuration) {
  if (ENERGY_MODULE_TYPES.includes(model)) {
    return {
      moduleSupported: true,
      categoryAPI: SUPPORTED_CATEGORY_TYPE.ENERGY,
      apiNotConfigured: !configuration.energyApi,
    };
  }
  if (WEATHER_MODULE_TYPES.includes(model)) {
    return {
      moduleSupported: true,
      categoryAPI: SUPPORTED_CATEGORY_TYPE.WEATHER,
      apiNotConfigured: !configuration.weatherApi,
    };
  }
  if (SECURITY_MODULE_TYPES.includes(model)) {
    return {
      moduleSupported: true,
      categoryAPI: SUPPORTED_CATEGORY_TYPE.SECURITY,
      apiNotConfigured: !configuration.securityApi,
    };
  }
  return {
    moduleSupported: false,
    categoryAPI: SUPPORTED_CATEGORY_TYPE.UNKNOWN,
    apiNotConfigured: false,
  };
}

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
    const url = `${API.HOMESTATUS}?${new URLSearchParams(paramsForm).toString()}`;
    const responseGetHomestatus = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });
    const rawBody = await responseGetHomestatus.text();
    if (!responseGetHomestatus.ok) {
      logger.error('Netatmo error: ', responseGetHomestatus.status, rawBody);
    }

    const data = JSON.parse(rawBody);
    const { body, status } = data;
    const { rooms: roomsHomestatus = [], modules: modulesHomestatus } = body.home;
    // Depending on the API response, unreachable module errors are reported at body or home level.
    const errorsHomestatus = body.home.errors ?? body.errors ?? [];

    if (status === 'ok') {
      if (modulesHomestatus) {
        listDevices = modulesHomestatus.map((module) => {
          const { moduleSupported, categoryAPI, apiNotConfigured } = getModuleCategory(module.type, this.configuration);

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

        /* Modules referenced in homesdata but absent from the homestatus "modules" array
        (e.g. powered-off devices reported in the homestatus "errors" array) are rebuilt
        from homesdata so they can still be discovered and saved. */
        const unreachableModules = modulesHomeData
          .filter((moduleHomeData) => !modulesHomestatus.some((module) => module.id === moduleHomeData.id))
          .map((moduleHomeData) => {
            const { moduleSupported, categoryAPI, apiNotConfigured } = getModuleCategory(
              moduleHomeData.type,
              this.configuration,
            );
            const moduleError = errorsHomestatus.find((error) => error.id === moduleHomeData.id);
            const roomDevice = {
              ...roomsHomeData.find((roomHomeData) => roomHomeData.id === moduleHomeData.room_id),
              ...roomsHomestatus.find((room) => room.id === moduleHomeData.room_id),
            };
            const plugDevice = {
              ...modulesHomeData.find((mod) => mod.id === moduleHomeData.bridge),
              ...modulesHomestatus.find((modulePlug) => modulePlug.id === moduleHomeData.bridge),
            };
            const plug = Object.keys(plugDevice).length === 0 ? undefined : plugDevice;
            const deviceSupported = {
              ...moduleHomeData,
              home: homeId,
              room: roomDevice,
              plug,
              reachable: false,
              apiErrorCode: moduleError ? moduleError.code : undefined,
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
        listDevices = [...listDevices, ...unreachableModules];
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
