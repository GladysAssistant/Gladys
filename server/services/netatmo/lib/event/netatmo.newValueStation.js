const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

/**
 * @description New value thermostat received.
 * @param {Object} message - Message received.
 * @param {Object} data - Data received.
 * @example
 * newValueThermostat(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValueStation(data) {
  const sid = data._id;
  logger.debug(`Netatmo : New value stations, sid = ${sid}`);
  this.devices[sid] = data;
  const newSensor = {
    service_id: this.serviceId,
    name: data.station_name,
    selector: `netatmo:${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-station',
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: 'Temperature',
        selector: `netatmo:${sid}:temperature`,
        external_id: `netatmo:${sid}:temperature`,
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60,
      },
      {
        name: 'Humidity',
        selector: `netatmo:${sid}:humidity`,
        external_id: `netatmo:${sid}:humidity`,
        category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
      {
        name: 'CO2',
        selector: `netatmo:${sid}:co2`,
        external_id: `netatmo:${sid}:co2`,
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1000,
      },
      {
        name: 'Pressure',
        selector: `netatmo:${sid}:pressure`,
        external_id: `netatmo:${sid}:pressure`,
        category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PASCAL,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 3000,
        max: 11000,
      }
    ],
  };
  this.addSensor(sid, newSensor);
  // eslint-disable-next-line no-restricted-syntax
  for (let module of this.devices[sid].modules) {
    const sidModule = module._id;
    logger.debug(`Netatmo : New value stations, sid = ${sidModule}`);
    this.devices[sidModule] = module;
    let newSensor2;
    if(module.data_type[0] === 'Wind'){
      newSensor2 = {
        service_id: this.serviceId,
        name: module.module_name,
        selector: `netatmo:${sidModule}`,
        external_id: `netatmo:${sidModule}`,
        model: 'netatmo-station-wind',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        features: [
        {
          name: 'Wind strength',
          selector: `netatmo:${sidModule}:WindStrength`,
          external_id: `netatmo:${sidModule}:WindStrength`,
          category: DEVICE_FEATURE_CATEGORIES.WINDSPEED_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.KILOMETER_HOUR,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 160,
        },
        {
          name: 'Wind angle',
          selector: `netatmo:${sidModule}:WindAngle`,
          external_id: `netatmo:${sidModule}:WindAngle`,
          category: DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.STRING,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 360,
        },
        {
          name: 'Gust strength',
          selector: `netatmo:${sidModule}:GustStrength`,
          external_id: `netatmo:${sidModule}:GustStrength`,
          category: DEVICE_FEATURE_CATEGORIES.WINDSPEED_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.KILOMETER_HOUR,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 160,
        },
        {
          name: 'Gust angle',
          selector: `netatmo:${sidModule}:GustAngle`,
          external_id: `netatmo:${sidModule}:GustAngle`,
          category: DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.STRING,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 360,
        },
        {
          name: 'Max wind strength day',
          selector: `netatmo:${sidModule}:max_wind_str`,
          external_id: `netatmo:${sidModule}:max_wind_str`,
          category: DEVICE_FEATURE_CATEGORIES.WINDSPEED_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.KILOMETER_HOUR,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 160,
        },
        {
          name: 'Max wind angle day',
          selector: `netatmo:${sidModule}:max_wind_angle`,
          external_id: `netatmo:${sidModule}:max_wind_angle`,
          category: DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.STRING,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 360,
        }
        ],
      };
    }
    if(module.data_type[0] === 'Rain'){
      newSensor2 = {
        service_id: this.serviceId,
        name: module.module_name,
        selector: `netatmo:${sidModule}`,
        external_id: `netatmo:${sidModule}`,
        model: 'netatmo-station-rain',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        features: [
        {
          name: 'Rain',
          selector: `netatmo:${sidModule}:rain`,
          external_id: `netatmo:${sidModule}:rain`,
          category: DEVICE_FEATURE_CATEGORIES.RAINFALL_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.MILLIMETER_HOUR,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 150,
        },
        {
          name: 'Sum Rain last 1 hour',
          selector: `netatmo:${sidModule}:sum_rain_1`,
          external_id: `netatmo:${sidModule}:sum_rain_1`,
          category: DEVICE_FEATURE_CATEGORIES.RAINFALL_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.MILLIMETER,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 150,
        },
        {
          name: 'Sum Rain last 24 hours',
          selector: `netatmo:${sidModule}:sum_rain_24`,
          external_id: `netatmo:${sidModule}:sum_rain_24`,
          category: DEVICE_FEATURE_CATEGORIES.RAINFALL_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.MILLIMETER,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 150,
        }
        ],
      };
    }
    if(module.data_type[0] !== 'Rain' && module.data_type[0] !== 'Wind') {
      if(module.data_type.length === 2) {
        newSensor2 = {
          service_id: this.serviceId,
          name: module.module_name,
          selector: `netatmo:${sidModule}`,
          external_id: `netatmo:${sidModule}`,
          model: 'netatmo-station-outdoor',
          should_poll: true,
          poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
          features: [
            {
              name: 'Temperature',
              selector: `netatmo:${sidModule}:temperature`,
              external_id: `netatmo:${sidModule}:temperature`,
              category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.CELSIUS,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: -20,
              max: 60,
            },
            {
              name: 'Humidity',
              selector: `netatmo:${sidModule}:humidity`,
              external_id: `netatmo:${sidModule}:humidity`,
              category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.PERCENT,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: 0,
              max: 100,
            },
            {
              name: 'Temperature mini',
              selector: `netatmo:${sidModule}:min_temp`,
              external_id: `netatmo:${sidModule}:min_temp`,
              category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.CELSIUS,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: -20,
              max: 60,
            },
            {
              name: 'Temperature maxi',
              selector: `netatmo:${sidModule}:max_temp`,
              external_id: `netatmo:${sidModule}:max_temp`,
              category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.CELSIUS,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: -20,
              max: 60,
            }
          ],
        };
      }
    } else {
      if(module.data_type.length === 4)  {
        newSensor2 = {
          service_id: this.serviceId,
          name: module.module_name,
          selector: `netatmo:${sidModule}`,
          external_id: `netatmo:${sidModule}`,
          model: 'netatmo-station-outdoor',
          should_poll: true,
          poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
          features: [
            {
              name: 'Temperature',
              selector: `netatmo:${sidModule}:temperature`,
              external_id: `netatmo:${sidModule}:temperature`,
              category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.CELSIUS,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: -20,
              max: 60,
            },
            {
              name: 'Humidity',
              selector: `netatmo:${sidModule}:humidity`,
              external_id: `netatmo:${sidModule}:humidity`,
              category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.PERCENT,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: 0,
              max: 100,
            },
            {
              name: 'CO2',
              selector: `netatmo:${sidModule}:co2`,
              external_id: `netatmo:${sidModule}:co2`,
              category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.PERCENT,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: 0,
              max: 1000,
            },
            {
              name: 'Pressure',
              selector: `netatmo:${sidModule}:pressure`,
              external_id: `netatmo:${sidModule}:pressure`,
              category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.PASCAL,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: 3000,
              max: 11000,
            }
          ],
        };
      }
    }
    this.addSensor(sidModule, newSensor2);
  }
}

module.exports = {
  newValueStation,
};
