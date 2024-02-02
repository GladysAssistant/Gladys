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
  const { home: homeId, name, type: model, id, room = {}, plug = {} } = netatmoDevice;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert Weather device "${name}, ${model}"`);
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
    features.push(buildFeatureBattery(name, externalId));
    features.push(buildFeatureRfStrength(name, externalId));
    /* params */
    params = [
      { name: PARAMS.PLUG_ID, value: plug.id },
      { name: PARAMS.PLUG_NAME, value: plug.name },
    ];
  }
  if (isNotBatteryDevice) {
    const modulesBridged = netatmoDevice.modules_bridged || [];
    features.push(buildFeatureWifiStrength(name, externalId));
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
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      features.push(buildFeatureTemperature(`Minimum in ${roomName}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${roomName}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureCo2(name, externalId));
      features.push(buildFeatureHumidity(name, externalId));
      features.push(buildFeatureNoise(name, externalId));
      features.push(buildFeaturePressure(`Pressure - ${name}`, externalId, 'pressure'));
      features.push(buildFeaturePressure(`Absolute pressure - ${name}`, externalId, 'absolute_pressure'));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE1: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`Minimum in ${roomName}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${roomName}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureHumidity(name, externalId));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE2: {
      /* features specific Netatmo Weather */
      features.push(buildFeatureWindStrength(`Wind strength - ${name}`, externalId, 'wind_strength'));
      features.push(buildFeatureWindAngle(`Wind angle - ${name}`, externalId, 'wind_angle'));
      features.push(buildFeatureWindStrength(`Gust strength - ${name}`, externalId, 'wind_gust'));
      features.push(buildFeatureWindAngle(`Gust angle - ${name}`, externalId, 'wind_gust_angle'));
      features.push(buildFeatureWindStrength(`Maximum wind strength - ${name}`, externalId, 'max_wind_str'));
      features.push(buildFeatureWindAngle(`Maximum wind angle - ${name}`, externalId, 'max_wind_angle'));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE3: {
      /* features specific Netatmo Weather */
      features.push(buildFeatureRain(`Current rain - ${name}`, externalId, 'rain', DEVICE_FEATURE_UNITS.MM));
      features.push(
        buildFeatureRain(
          `Precipitation / 1h - ${name}`,
          externalId,
          'sum_rain_1',
          DEVICE_FEATURE_UNITS.MILLIMETER_PER_HOUR,
        ),
      );
      features.push(
        buildFeatureRain(
          `Sum rain / 24h - ${name}`,
          externalId,
          'sum_rain_24',
          DEVICE_FEATURE_UNITS.MILLIMETER_PER_DAY,
        ),
      );
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE4: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      features.push(buildFeatureTemperature(`Minimum in ${roomName}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${roomName}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureCo2(name, externalId));
      features.push(buildFeatureHumidity(name, externalId));
      break;
    }
    default:
      break;
  }
  const device = {
    name,
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
  logger.info(`Netatmo Weather device"${name}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceWeather,
};
