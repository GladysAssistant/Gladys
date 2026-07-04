const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const MeteoFranceController = require('./controllers/meteofrance.controller');
const { parseAlerts, parseVigilanceText } = require('./lib/vigilance.parser');
const { buildForecastSummary } = require('./lib/forecast.formatter');

const METEOFRANCE_API_KEY_VAR = 'METEOFRANCE_API_KEY';
const METEOFRANCE_WEBSERVICE_URL = 'https://webservice.meteofrance.com';
const METEOFRANCE_PUBLIC_TOKEN = '__Wj7dVSTjV9YGu1guveLyDq0g7S7TfTjaHBTPTpO0kj8__';
const MAP_CACHE_TTL_MS = 15 * 60 * 1000;
const VIGILANCE_POLL_INTERVAL_MS = 15 * 60 * 1000;

/**
 * @description Météo France service, based on the Météo France mobile webservice.
 * @param {any} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @returns {object} MeteoFranceService object.
 * @example
 * MeteoFranceService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
 */
module.exports = function MeteoFranceService(gladys, serviceId) {
  const { default: axios } = require('axios');
  /** @type {string|null} */
  let meteoFranceApiKey = null;
  /** @type {{ image: string|null, timestamp: number }} */
  let mapCache = { image: null, timestamp: 0 };
  /** @type {Object<string, string>} */
  const deptByHouse = {};
  /** @type {Object<string, number>} */
  const lastColorByHouse = {};
  /** @type {any} */
  let vigilancePollTimer = null;

  /**
   * @description Get vigilance warnings for a department from Météo France mobile webservice.
   * @param {string} dept - French department number (e.g. "06", "75").
   * @returns {Promise<any>} Resolve with warning data (phenomena colors and bulletin text).
   * @example
   * const data = await gladys.services.meteofrance.vigilance.get('06');
   */
  async function getVigilance(dept) {
    const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/v3/warning/full`, {
      params: {
        domain: dept,
        token: METEOFRANCE_PUBLIC_TOKEN,
      },
      timeout: 10000,
    });
    return data;
  }

  /**
   * @description Get the national vigilance map thumbnail (requires the optional API key).
   * @returns {Promise<string|null>} Resolve with a data URL, or null when no API key is configured.
   * @example
   * const image = await gladys.services.meteofrance.vigilance.getMap();
   */
  async function getVigilanceMap() {
    if (!meteoFranceApiKey) {
      return null;
    }
    if (mapCache.image && Date.now() - mapCache.timestamp < MAP_CACHE_TTL_MS) {
      return mapCache.image;
    }
    const url = 'https://public-api.meteofrance.fr/public/DPVigilance/v1/vignettenationale-J/encours';
    const response = await axios.get(url, {
      headers: { apikey: meteoFranceApiKey },
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const contentType = response.headers['content-type'] || 'image/png';
    // @ts-ignore: Buffer is a Node.js global, @types/node is not installed in this project
    const image = `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`;
    mapCache = { image, timestamp: Date.now() };
    return image;
  }

  /**
   * @description Get weather forecast from Météo France mobile webservice.
   * @param {number} lat - Latitude.
   * @param {number} lon - Longitude.
   * @returns {Promise<any>} Resolve with forecast data.
   * @example
   * const data = await gladys.services.meteofrance.forecast.get(48.85, 2.35);
   */
  async function getForecast(lat, lon) {
    const options = {
      params: {
        lat,
        lon,
        lang: 'fr',
        token: METEOFRANCE_PUBLIC_TOKEN,
      },
      // The Météo France API can take ~20s on a cold cache, then answers in ~50ms
      timeout: 30000,
    };
    try {
      const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/forecast`, options);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : `${e}`;
      logger.info(`[MeteoFrance] getForecast retrying after error: ${message}`);
      const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/forecast`, options);
      return data;
    }
  }

  /**
   * @description Get a human readable forecast summary for a house.
   * @param {any} house - House object with latitude/longitude.
   * @param {number} days - Number of days in the summary (1 to 5).
   * @returns {Promise<object>} Today values and a multi-day summary text.
   * @example
   * const summary = await gladys.services.meteofrance.forecast.getSummaryForHouse(house, 2);
   */
  async function getForecastSummaryForHouse(house, days) {
    const data = await getForecast(house.latitude, house.longitude);
    return buildForecastSummary(data, days);
  }

  /**
   * @description Get the current vigilance state for a house (department auto-detected).
   * @param {any} house - House object with latitude/longitude.
   * @returns {Promise<{ dept: string, color: number, alerts: Array<object>, text: string }>} Vigilance state.
   * @example
   * const vigilance = await gladys.services.meteofrance.vigilance.getForHouse(house);
   */
  async function getHouseVigilance(house) {
    let dept = deptByHouse[house.selector];
    if (!dept) {
      const forecast = await getForecast(house.latitude, house.longitude);
      dept = (forecast && forecast.position && forecast.position.dept) || null;
      if (!dept) {
        throw new Error('MeteoFrance: no department found for this house');
      }
      deptByHouse[house.selector] = dept;
    }
    const warningData = await getVigilance(dept);
    return {
      dept,
      color: (warningData && warningData.color_max) || 1,
      alerts: parseAlerts(warningData, dept),
      text: parseVigilanceText(warningData),
    };
  }

  /**
   * @description Check vigilance level for every house and fire a scene trigger when it raises.
   * @returns {Promise<void>} Resolve when every house has been checked.
   * @example
   * await gladys.services.meteofrance.vigilance.check();
   */
  async function checkVigilance() {
    /** @type {Array<any>} */
    const houses = await gladys.house.get();
    await Promise.all(
      houses
        .filter((house) => house.latitude != null && house.longitude != null)
        .map(async (house) => {
          try {
            let dept = deptByHouse[house.selector];
            if (!dept) {
              const forecast = await getForecast(house.latitude, house.longitude);
              dept = (forecast && forecast.position && forecast.position.dept) || null;
              if (!dept) {
                return;
              }
              deptByHouse[house.selector] = dept;
            }
            const warningData = await getVigilance(dept);
            const color = (warningData && warningData.color_max) || 1;
            const previousColor = lastColorByHouse[house.selector];
            lastColorByHouse[house.selector] = color;
            if (previousColor === undefined) {
              // First check since service start: record the baseline without firing
              return;
            }
            if (color > previousColor && color >= 2) {
              logger.info(
                `[MeteoFrance] Vigilance raised from ${previousColor} to ${color} for house ${house.selector} (dept=${dept})`,
              );
              gladys.event.emit(EVENTS.TRIGGERS.CHECK, {
                type: EVENTS.METEO_FRANCE.NEW_VIGILANCE,
                house: house.selector,
                dept,
                color,
                alerts: parseAlerts(warningData, dept),
              });
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : `${e}`;
            logger.warn(`[MeteoFrance] vigilance check failed for house ${house.selector}: ${message}`);
          }
        }),
    );
  }

  /**
   * @description Run a vigilance check without letting errors bubble up.
   * @returns {Promise<void>} Resolve when done.
   * @example
   * await safeCheckVigilance();
   */
  async function safeCheckVigilance() {
    try {
      await checkVigilance();
    } catch (e) {
      const message = e instanceof Error ? e.message : `${e}`;
      logger.warn(`[MeteoFrance] vigilance check failed: ${message}`);
    }
  }

  /**
   * @public
   * @description This function starts the service. Forecast and vigilance work without
   * any configuration; the API key is optional and only unlocks the vigilance map.
   * @example
   * gladys.services.meteofrance.start();
   */
  async function start() {
    logger.info('Starting MeteoFrance service');
    meteoFranceApiKey = await gladys.variable.getValue(METEOFRANCE_API_KEY_VAR, serviceId);
    if (meteoFranceApiKey) {
      logger.info('MeteoFrance: API key configured, vigilance map available');
    }
    // Poll vigilance to fire scene triggers; the first check records the baseline
    vigilancePollTimer = setInterval(safeCheckVigilance, VIGILANCE_POLL_INTERVAL_MS);
    safeCheckVigilance();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.meteofrance.stop();
   */
  async function stop() {
    logger.info('Stopping MeteoFrance service');
    if (vigilancePollTimer) {
      clearInterval(vigilancePollTimer);
      vigilancePollTimer = null;
    }
  }

  return Object.freeze({
    start,
    stop,
    controllers: MeteoFranceController(gladys, getVigilance, getForecast, getVigilanceMap),
    vigilance: {
      get: getVigilance,
      getMap: getVigilanceMap,
      getForHouse: getHouseVigilance,
      check: checkVigilance,
    },
    forecast: {
      get: getForecast,
      getSummaryForHouse: getForecastSummaryForHouse,
    },
  });
};
