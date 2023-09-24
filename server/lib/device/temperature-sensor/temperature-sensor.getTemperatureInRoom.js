const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');

const DEFAULT_PARAMETERS = {
  unit: DEVICE_FEATURE_UNITS.CELSIUS,
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
        where: {
          room_id: roomId,
        },
      },
    ],
    where: {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      last_value: {
        [Op.not]: null,
      },
      last_value_changed: {
        // we want fresh value, less than 1h
        [Op.gt]: oneHourAgo,
      },
    },
  });

  if (deviceFeatures.length === 0) {
    return {
      temperature: null,
      unit: optionsWithDefault.unit,
    };
  }

  let total = 0;

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
    total += temperature;
  });

  // we calculate the average value
  const averageTemperature = total / deviceFeatures.length;

  // return temperature and unit
  return {
    temperature: averageTemperature,
    unit: optionsWithDefault.unit,
  };
}

module.exports = {
  getTemperatureInRoom,
};
