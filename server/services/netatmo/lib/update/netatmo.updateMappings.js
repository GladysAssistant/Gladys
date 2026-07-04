const { SUPPORTED_MODULE_TYPE } = require('../utils/netatmo.constants');

/**
 * Declarative mapping of Gladys feature suffixes to Netatmo API values, per module type.
 * Key order drives the emission order of NEW_STATE events.
 * A value extractor returning undefined/null means "no value available, skip the emission".
 */
const UPDATE_MAPPINGS = {
  [SUPPORTED_MODULE_TYPE.PLUG]: {
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength,
    wifi_strength: (deviceNetatmo) => deviceNetatmo.wifi_strength,
    plug_connected_boiler: (deviceNetatmo) => deviceNetatmo.plug_connected_boiler ?? false,
  },
  [SUPPORTED_MODULE_TYPE.THERMOSTAT]: {
    battery_percent: (deviceNetatmo) => deviceNetatmo.battery_percent,
    temperature: (deviceNetatmo) => deviceNetatmo.measured?.temperature,
    therm_measured_temperature: (deviceNetatmo) => deviceNetatmo.room?.therm_measured_temperature,
    therm_setpoint_temperature: (deviceNetatmo) => deviceNetatmo.room?.therm_setpoint_temperature,
    open_window: (deviceNetatmo) => deviceNetatmo.room?.open_window,
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength,
    boiler_status: (deviceNetatmo) => deviceNetatmo.boiler_status,
  },
  [SUPPORTED_MODULE_TYPE.NRV]: {
    battery_percent: (deviceNetatmo) => deviceNetatmo.battery_state,
    therm_measured_temperature: (deviceNetatmo) => deviceNetatmo.room?.therm_measured_temperature,
    therm_setpoint_temperature: (deviceNetatmo) => deviceNetatmo.room?.therm_setpoint_temperature,
    open_window: (deviceNetatmo) => deviceNetatmo.room?.open_window,
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength,
    heating_power_request: (deviceNetatmo) => {
      const heatingPowerRequest = deviceNetatmo.room?.heating_power_request;
      return heatingPowerRequest === undefined || heatingPowerRequest === null ? undefined : heatingPowerRequest > 0;
    },
  },
  [SUPPORTED_MODULE_TYPE.NAMAIN]: {
    temperature: (deviceNetatmo) => deviceNetatmo.temperature ?? deviceNetatmo.dashboard_data?.Temperature,
    therm_measured_temperature: (deviceNetatmo) => deviceNetatmo.room?.therm_measured_temperature,
    co2: (deviceNetatmo) => deviceNetatmo.co2 ?? deviceNetatmo.dashboard_data?.CO2,
    humidity: (deviceNetatmo) => deviceNetatmo.humidity ?? deviceNetatmo.dashboard_data?.Humidity,
    noise: (deviceNetatmo) => deviceNetatmo.noise ?? deviceNetatmo.dashboard_data?.Noise,
    pressure: (deviceNetatmo) => deviceNetatmo.pressure ?? deviceNetatmo.dashboard_data?.Pressure,
    absolute_pressure: (deviceNetatmo) =>
      deviceNetatmo.absolute_pressure ?? deviceNetatmo.dashboard_data?.AbsolutePressure,
    min_temp: (deviceNetatmo) => deviceNetatmo.dashboard_data?.min_temp,
    max_temp: (deviceNetatmo) => deviceNetatmo.dashboard_data?.max_temp,
    wifi_strength: (deviceNetatmo) => deviceNetatmo.wifi_strength ?? deviceNetatmo.wifi_status,
  },
  [SUPPORTED_MODULE_TYPE.NAMODULE1]: {
    battery_percent: (deviceNetatmo) => deviceNetatmo.battery_percent,
    temperature: (deviceNetatmo) => deviceNetatmo.temperature ?? deviceNetatmo.dashboard_data?.Temperature,
    humidity: (deviceNetatmo) => deviceNetatmo.humidity ?? deviceNetatmo.dashboard_data?.Humidity,
    min_temp: (deviceNetatmo) => deviceNetatmo.dashboard_data?.min_temp,
    max_temp: (deviceNetatmo) => deviceNetatmo.dashboard_data?.max_temp,
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength ?? deviceNetatmo.dashboard_data?.rf_status,
  },
  [SUPPORTED_MODULE_TYPE.NAMODULE2]: {
    battery_percent: (deviceNetatmo) => deviceNetatmo.battery_percent,
    wind_strength: (deviceNetatmo) => deviceNetatmo.wind_strength ?? deviceNetatmo.dashboard_data?.WindStrength,
    wind_angle: (deviceNetatmo) => deviceNetatmo.wind_angle ?? deviceNetatmo.dashboard_data?.WindAngle,
    wind_gust: (deviceNetatmo) => deviceNetatmo.wind_gust ?? deviceNetatmo.dashboard_data?.GustStrength,
    wind_gust_angle: (deviceNetatmo) => deviceNetatmo.wind_gust_angle ?? deviceNetatmo.dashboard_data?.GustAngle,
    max_wind_str: (deviceNetatmo) => deviceNetatmo.dashboard_data?.max_wind_str,
    max_wind_angle: (deviceNetatmo) => deviceNetatmo.dashboard_data?.max_wind_angle,
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength ?? deviceNetatmo.dashboard_data?.rf_status,
  },
  [SUPPORTED_MODULE_TYPE.NAMODULE3]: {
    battery_percent: (deviceNetatmo) => deviceNetatmo.battery_percent,
    rain: (deviceNetatmo) => deviceNetatmo.rain ?? deviceNetatmo.dashboard_data?.Rain,
    sum_rain_1: (deviceNetatmo) => deviceNetatmo.sum_rain_1 ?? deviceNetatmo.dashboard_data?.sum_rain_1,
    sum_rain_24: (deviceNetatmo) => deviceNetatmo.sum_rain_24 ?? deviceNetatmo.dashboard_data?.sum_rain_24,
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength ?? deviceNetatmo.dashboard_data?.rf_status,
  },
  [SUPPORTED_MODULE_TYPE.NAMODULE4]: {
    battery_percent: (deviceNetatmo) => deviceNetatmo.battery_percent,
    temperature: (deviceNetatmo) => deviceNetatmo.temperature ?? deviceNetatmo.dashboard_data?.Temperature,
    therm_measured_temperature: (deviceNetatmo) => deviceNetatmo.room?.therm_measured_temperature,
    co2: (deviceNetatmo) => deviceNetatmo.co2 ?? deviceNetatmo.dashboard_data?.CO2,
    humidity: (deviceNetatmo) => deviceNetatmo.humidity ?? deviceNetatmo.dashboard_data?.Humidity,
    min_temp: (deviceNetatmo) => deviceNetatmo.dashboard_data?.min_temp,
    max_temp: (deviceNetatmo) => deviceNetatmo.dashboard_data?.max_temp,
    rf_strength: (deviceNetatmo) => deviceNetatmo.rf_strength ?? deviceNetatmo.dashboard_data?.rf_status,
  },
  [SUPPORTED_MODULE_TYPE.NACAMERA]: {
    monitoring: (deviceNetatmo) =>
      deviceNetatmo.monitoring === undefined || deviceNetatmo.monitoring === null
        ? undefined
        : deviceNetatmo.monitoring === 'on',
    wifi_strength: (deviceNetatmo) => deviceNetatmo.wifi_strength ?? deviceNetatmo.wifi_status,
  },
  [SUPPORTED_MODULE_TYPE.NOC]: {
    monitoring: (deviceNetatmo) =>
      deviceNetatmo.monitoring === undefined || deviceNetatmo.monitoring === null
        ? undefined
        : deviceNetatmo.monitoring === 'on',
    wifi_strength: (deviceNetatmo) => deviceNetatmo.wifi_strength ?? deviceNetatmo.wifi_status,
  },
};

module.exports = {
  UPDATE_MAPPINGS,
};
