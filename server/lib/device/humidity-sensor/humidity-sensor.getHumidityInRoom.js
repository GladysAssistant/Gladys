const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');

const DEFAULT_PARAMETERS = {
  unit: DEVICE_FEATURE_UNITS.PERCENT,
};

/**
 * @description Return the average value of the humidity in a room.
 * @param {string} roomId - The uuid of the room.
 * @param {object} [options] - Options of the query (units).
 * @returns {Promise} - Resolve with the humidity and the unit.
 * @example
 * getHumidityInRoom('d65deccf-d8fc-4674-ac50-3d98d1d87aba', {
 *  unit: 'percent',
 * });
 */
async function getHumidityInRoom(roomId, options) {
  logger.debug(`Getting average humidity in room ${roomId}`);
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
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
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
      humidity: null,
      unit: optionsWithDefault.unit,
    };
  }

  const total = deviceFeatures.reduce((prev, deviceFeature) => deviceFeature.last_value + prev, 0);

  // we calculate the average value
  const averageHumidity = total / deviceFeatures.length;

  // return humidity and unit
  return {
    humidity: averageHumidity,
    unit: optionsWithDefault.unit,
  };
}

module.exports = {
  getHumidityInRoom,
};
