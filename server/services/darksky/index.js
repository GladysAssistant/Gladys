const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { formatResults } = require('./lib/formatResults');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

const DARKSKY_API_KEY = 'DARKSKY_API_KEY';

module.exports = function DarkSkyService(gladys, serviceId) {
  const { default: axios } = require('axios');
  const moment = require('moment');
  let darkSkyApiKey;

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.darksky.start();
   */
  async function start() {
    logger.info('Starting Dark Sky service');
    darkSkyApiKey = await gladys.variable.getValue(DARKSKY_API_KEY, serviceId);
    if (!darkSkyApiKey) {
      throw new ServiceNotConfiguredError('Dark Sky Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.darksky.stop();
   */
  async function stop() {
    logger.log('stopping Dark Sky service');
  }

  /**
   * @description Get the weather.
   * @param {Object} options - Options parameters.
   * @param {number} options.latitude - The latitude to get the weather from.
   * @param {number} options.longitude - The longitude to get the weather from.
   * @param {number} [options.offset] - Get weather in the future, offset is in hour.
   * @param {number} [options.datetime] - Get weather at a specified time in the future, time is a timestamp in seconds.
   * @param {string} [options.mode] - Get display mode to return [basic, advanced].
   * @param {string} [options.target] - Get time target for result [currently, hourly, daily].
   * @param {string} [options.language] - The language of the report.
   * @param {string} [options.units] - Unit of the weather [auto, si, us].
   * @example
   * gladys.services.darksky.weather.get({
   *   latitude: 112,
   *   longitude: -2,
   *   offset: 0,
   *   datetime: 1562703427,
   *   language: 'fr',
   *   units: 'si',
   *   mode: 'basic'
   * });
   */
  async function get(options) {
    const DEFAULT = {
      language: 'en',
      units: 'si',
      offset: 0,
      target: 'currently',
    };

    if (!darkSkyApiKey) {
      throw new ServiceNotConfiguredError('Dark Sky API Key not found');
    }
    const optionsMerged = Object.assign({}, DEFAULT, options);
    const { latitude, longitude, language, units, offset, datetime } = optionsMerged;
    let timestamp = '';
    if (offset !== 0) {
      timestamp = `, ${moment()
        .add(offset, 'hours')
        .unix()}`;
    }
    if (datetime) {
      timestamp = `,${datetime}`;
    }
    const url = `https://api.darksky.net/forecast/${darkSkyApiKey}/${latitude},${longitude}${timestamp}?language=${language}&units=${units}`;
    try {
      const { data } = await axios.get(url);
      const weatherFormatted = formatResults(optionsMerged, data);
      return weatherFormatted;
    } catch (e) {
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  return Object.freeze({
    start,
    stop,
    weather: {
      get,
    },
  });
};
