const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, PARAMS } = require('../utils/netatmo.constants');
const {
  buildFeatureBattery,
  buildFeatureRfStrength,
  buildFeatureWifiStrength,
} = require('./netatmo.buildFeaturesCommon');
const { buildFeatureTemperature } = require('./netatmo.buildFeaturesCommonTemp');
const {
  buildFeatureCo2,
  buildFeatureHumidity,
  buildFeatureNoise,
  buildFeaturePressure,
  buildFeatureWindStrength,
  buildFeatureWindAngle,
  buildFeatureRain,
} = require('./netatmo.buildFeaturesSpecifWeather');
const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

/**
 * @description Transform Netatmo Weather device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDeviceWeather({ ... });
 */
function convertDeviceWeather(netatmoDevice) {
  const { home, name, type: model, room = {}, plug = {} } = netatmoDevice;
  const id = netatmoDevice.id || netatmoDevice._id;
  const homeId = home || netatmoDevice.home_id;
  const nameDevice = name || netatmoDevice.module_name || netatmoDevice.station_name;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert Weather device "${nameDevice}, ${model}"`);
  const features = [];
  let params = [];
  let roomName = 'undefined';
  const isNotBatteryDevice = model === SUPPORTED_MODULE_TYPE.NAMAIN;
  const isBatteryDevice =
    model === SUPPORTED_MODULE_TYPE.NAMODULE1 ||
    model === SUPPORTED_MODULE_TYPE.NAMODULE2 ||
    model === SUPPORTED_MODULE_TYPE.NAMODULE3 ||
    model === SUPPORTED_MODULE_TYPE.NAMODULE4;

  if (isBatteryDevice) {
    features.push(buildFeatureBattery(nameDevice, externalId));
    features.push(buildFeatureRfStrength(nameDevice, externalId));
    /* params */
    const plugId = plug.id || plug._id;
    const plugName = plug.name || plug.module_name || plug.station_name;
    if (plugId) {
      params = [
        { name: PARAMS.PLUG_ID, value: plugId },
        { name: PARAMS.PLUG_NAME, value: plugName },
      ];
    }
  }
  if (isNotBatteryDevice) {
    const modulesBridged = netatmoDevice.modules_bridged || [];
    features.push(buildFeatureWifiStrength(nameDevice, externalId));
    /* params */
    params = [{ name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) }];
  }
  /* params common to all devices features */
  params.push({ name: PARAMS.HOME_ID, value: homeId });
  if (room.id) {
    roomName = room.name;
    params.push({ name: PARAMS.ROOM_ID, value: room.id }, { name: PARAMS.ROOM_NAME, value: roomName });
  }

  switch (model) {
    case SUPPORTED_MODULE_TYPE.NAMAIN: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(nameDevice, externalId, 'temperature'));
      if (room.id) {
        features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      }
      features.push(buildFeatureTemperature(`Minimum in ${roomName}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${roomName}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureCo2(nameDevice, externalId));
      features.push(buildFeatureHumidity(nameDevice, externalId));
      features.push(buildFeatureNoise(nameDevice, externalId));
      features.push(buildFeaturePressure(`Pressure - ${nameDevice}`, externalId, 'pressure'));
      features.push(buildFeaturePressure(`Absolute pressure - ${nameDevice}`, externalId, 'absolute_pressure'));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE1: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(nameDevice, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`Minimum in ${roomName}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${roomName}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureHumidity(nameDevice, externalId));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE2: {
      /* features specific Netatmo Weather */
      features.push(buildFeatureWindStrength(`Wind strength - ${nameDevice}`, externalId, 'wind_strength'));
      features.push(buildFeatureWindAngle(`Wind angle - ${nameDevice}`, externalId, 'wind_angle'));
      features.push(buildFeatureWindStrength(`Gust strength - ${nameDevice}`, externalId, 'wind_gust'));
      features.push(buildFeatureWindAngle(`Gust angle - ${nameDevice}`, externalId, 'wind_gust_angle'));
      features.push(buildFeatureWindStrength(`Maximum wind strength - ${nameDevice}`, externalId, 'max_wind_str'));
      features.push(buildFeatureWindAngle(`Maximum wind angle - ${nameDevice}`, externalId, 'max_wind_angle'));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE3: {
      /* features specific Netatmo Weather */
      features.push(buildFeatureRain(`Current rain - ${nameDevice}`, externalId, 'rain', DEVICE_FEATURE_UNITS.MM));
      features.push(
        buildFeatureRain(
          `Precipitation / 1h - ${nameDevice}`,
          externalId,
          'sum_rain_1',
          DEVICE_FEATURE_UNITS.MILLIMETER_PER_HOUR,
        ),
      );
      features.push(
        buildFeatureRain(
          `Sum rain / 24h - ${nameDevice}`,
          externalId,
          'sum_rain_24',
          DEVICE_FEATURE_UNITS.MILLIMETER_PER_DAY,
        ),
      );
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE4: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(nameDevice, externalId, 'temperature'));
      if (room.id) {
        features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      }
      features.push(buildFeatureTemperature(`Minimum in ${roomName}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${roomName}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureCo2(nameDevice, externalId));
      features.push(buildFeatureHumidity(nameDevice, externalId));
      break;
    }
    default:
      break;
  }
  const device = {
    name: nameDevice,
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    should_poll: false,
    features: features.filter((feature) => feature),
    params: params.filter((param) => param),
  };
  if (netatmoDevice.not_handled) {
    device.not_handled = true;
  }
  logger.info(`Netatmo Weather device"${nameDevice}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceWeather,
};
