const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');

const DEFAULT_PARAMETERS = {
  unit: DEVICE_FEATURE_UNITS.CELSIUS,
};

// Define reasonable temperature bounds (in celsius)
const TEMPERATURE_BOUNDS = {
  MIN: -273,
  MAX: 200,
};

/**
 * @description Return the average value of the temperature in a room.
 * @param {string} roomId - The uuid of the room.
 * @param {object} [options] - Options of the query (units).
 * @returns {Promise} - Resolve with the temperature and the unit.
 * @example
 * getTemperatureInRoom('d65deccf-d8fc-4674-ac50-3d98d1d87aba', {
 *  unit: 'celsius',
 * });
 */
async function getTemperatureInRoom(roomId, options) {
  logger.debug(`Getting average temperature in room ${roomId}`);
  const optionsWithDefault = { ...DEFAULT_PARAMETERS, ...options };

  const oneHourAgo = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);
  const deviceFeatures = await db.DeviceFeature.findAll({
    attributes: ['last_value', 'unit'],
    include: [
      {
        model: db.Device,
        as: 'device',
        attributes: ['id', 'name', 'selector'],
        where: {
          room_id: roomId,
        },
      },
    ],
    where: {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: {
        [Op.or]: [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL, DEVICE_FEATURE_TYPES.TEMPERATURE_SENSOR.AVERAGE],
      },
      last_value: {
        [Op.not]: null,
      },
      last_value_changed: {
        // we want fresh value, less than 1h
        [Op.gt]: oneHourAgo,
      },
    },
  });

  let total = 0;
  let validTemperatureValues = 0;

  deviceFeatures.forEach((deviceFeature) => {
    let temperature;
    // if device feature is in celsius and user want fahrenheit
    if (
      deviceFeature.unit === DEVICE_FEATURE_UNITS.CELSIUS &&
      optionsWithDefault.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT
    ) {
      temperature = celsiusToFahrenheit(deviceFeature.last_value);
    } else if (
      deviceFeature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT &&
      optionsWithDefault.unit === DEVICE_FEATURE_UNITS.CELSIUS
    ) {
      // if device feature is in fahrenheit and user want celsius
      temperature = fahrenheitToCelsius(deviceFeature.last_value);
    } else {
      temperature = deviceFeature.last_value;
    }

    // Validate temperature value
    if (!isValidTemperature(temperature, optionsWithDefault.unit)) {
      logger.warn(
        `Invalid temperature value ${temperature} ${optionsWithDefault.unit} from device "${deviceFeature.device.name}" (${deviceFeature.device.selector}), skipping`,
      );
      return; // skip this value
    }

    total += temperature;
    validTemperatureValues += 1;
  });

  // If no valid temperatures found, return null
  if (validTemperatureValues === 0) {
    return {
      temperature: null,
      unit: optionsWithDefault.unit,
    };
  }

  // we calculate the average value
  const averageTemperature = total / validTemperatureValues;

  // return temperature and unit
  return {
    temperature: averageTemperature,
    unit: optionsWithDefault.unit,
  };
}

/**
 * @description Validate if a temperature value is valid.
 * @param {number} temperature - The temperature value to validate.
 * @param {string} unit - The unit of the temperature (celsius or fahrenheit).
 * @returns {boolean} - True if the temperature is valid, false otherwise.
 * @private
 */
function isValidTemperature(temperature, unit) {
  // Check if temperature is a number
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return false;
  }
  // Check if temperature is finite
  if (!isFinite(temperature)) {
    return false;
  }
  // Convert to celsius for bounds checking if needed and check bounds
  const temperatureInCelsius =
    unit === DEVICE_FEATURE_UNITS.FAHRENHEIT ? fahrenheitToCelsius(temperature) : temperature;

  if (temperatureInCelsius < TEMPERATURE_BOUNDS.MIN || temperatureInCelsius > TEMPERATURE_BOUNDS.MAX) {
    return false;
  }

  return true;
}

module.exports = {
  getTemperatureInRoom,
};