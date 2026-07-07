const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const MeteoController = require('./controllers/meteo.controller');
const { parseAlerts, parseVigilanceText } = require('./lib/vigilance.parser');
const { buildForecastSummary } = require('./lib/forecast.formatter');
const { formatOpenWeatherAsMeteoFrance } = require('./lib/openweather.formatter');

const METEO_SOURCE_VAR = 'METEO_SOURCE';
const METEOFRANCE_API_KEY_VAR = 'METEOFRANCE_API_KEY';
const OPENWEATHER_API_KEY_VAR = 'OPENWEATHER_API_KEY';
const METEO_SOURCES = {
  METEO_FRANCE: 'meteofrance',
  OPENWEATHER: 'openweather',
};
const METEOFRANCE_WEBSERVICE_URL = 'https://webservice.meteofrance.com';
const METEOFRANCE_PUBLIC_TOKEN = '__Wj7dVSTjV9YGu1guveLyDq0g7S7TfTjaHBTPTpO0kj8__';
const OPENWEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
const MAP_CACHE_TTL_MS = 15 * 60 * 1000;
const DEPT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const VIGILANCE_POLL_INTERVAL_MS = 15 * 60 * 1000;

/**
 * @description Meteo service: weather forecast with a selectable source
 * (Météo France mobile webservice or OpenWeather), plus Météo France vigilance.
 * @param {any} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @returns {object} MeteoService object.
 * @example
 * MeteoService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
 */
module.exports = function MeteoService(gladys, serviceId) {
  const { default: axios } = require('axios');
  /** @type {string} */
  let meteoSource = METEO_SOURCES.METEO_FRANCE;
  /** @type {string|null} */
  let meteoFranceApiKey = null;
  /** @type {string|null} */
  let openWeatherApiKey = null;
  /** @type {{ image: string|null, timestamp: number }} */
  let mapCache = { image: null, timestamp: 0 };
  /** @type {Object<string, { dept: string|null, timestamp: number }>} */
  const deptByHouse = {};
  /** @type {Object<string, number>} */
  const lastColorByHouse = {};
  /** @type {any} */
  let vigilancePollTimer = null;

  /**
   * @description Get the configured forecast source.
   * @returns {string} Source name ('meteofrance' or 'openweather').
   * @example
   * const source = gladys.services.meteo.getSource();
   */
  function getSource() {
    return meteoSource;
  }

  /**
   * @description Get vigilance warnings for a department from Météo France mobile webservice.
   * @param {string} dept - French department number (e.g. "06", "75").
   * @returns {Promise<any>} Resolve with warning data (phenomena colors and bulletin text).
   * @example
   * const data = await gladys.services.meteo.vigilance.get('06');
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
   * @description Get the national vigilance map thumbnail (requires the optional Météo France API key).
   * @returns {Promise<string|null>} Resolve with a data URL, or null when no API key is configured.
   * @example
   * const image = await gladys.services.meteo.vigilance.getMap();
   */
  async function getVigilanceMap() {
    // Vigilance is a Météo France feature: with the OpenWeather source,
    // nothing must be fetched from Météo France
    if (meteoSource !== METEO_SOURCES.METEO_FRANCE || !meteoFranceApiKey) {
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
   * const data = await gladys.services.meteo.forecast.getMeteoFrance(48.85, 2.35);
   */
  async function getMeteoFranceForecast(lat, lon) {
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
      logger.info(`[Meteo] getMeteoFranceForecast retrying after error: ${message}`);
      const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/forecast`, options);
      return data;
    }
  }

  /**
   * @description Get weather forecast from OpenWeather, converted to the Météo France format.
   * @param {number} lat - Latitude.
   * @param {number} lon - Longitude.
   * @returns {Promise<any>} Resolve with forecast data in the Météo France format.
   * @example
   * const data = await gladys.services.meteo.forecast.getOpenWeather(48.85, 2.35);
   */
  async function getOpenWeatherForecast(lat, lon) {
    if (!openWeatherApiKey) {
      const error = new Error('Meteo: OpenWeather API key is not configured');
      // @ts-ignore: custom field used by the controller to answer with a clean error
      error.code = 'OPENWEATHER_API_KEY_MISSING';
      throw error;
    }
    const params = {
      lat,
      lon,
      lang: 'fr',
      units: 'metric',
      appid: openWeatherApiKey,
    };
    const [{ data: current }, { data: forecast }] = await Promise.all([
      axios.get(`${OPENWEATHER_API_URL}/weather`, { params, timeout: 10000 }),
      axios.get(`${OPENWEATHER_API_URL}/forecast`, { params, timeout: 10000 }),
    ]);
    return formatOpenWeatherAsMeteoFrance(current, forecast);
  }

  /**
   * @description Get weather forecast from the configured source, always in the Météo France format.
   * @param {number} lat - Latitude.
   * @param {number} lon - Longitude.
   * @returns {Promise<any>} Resolve with forecast data.
   * @example
   * const data = await gladys.services.meteo.forecast.get(48.85, 2.35);
   */
  async function getForecast(lat, lon) {
    if (meteoSource === METEO_SOURCES.OPENWEATHER) {
      return getOpenWeatherForecast(lat, lon);
    }
    return getMeteoFranceForecast(lat, lon);
  }

  /**
   * @description Resolve the French department of a house from its coordinates, with a TTL cache
   * so coordinate changes are picked up without a service restart. Only used by the vigilance
   * features, which are exclusive to the Météo France source. Houses outside France resolve
   * (and cache) to null.
   * @param {any} house - House object with latitude/longitude.
   * @returns {Promise<string|null>} Department number, or null when not found.
   * @example
   * const dept = await getDeptForHouse(house);
   */
  async function getDeptForHouse(house) {
    const cached = deptByHouse[house.selector];
    if (cached && Date.now() - cached.timestamp < DEPT_CACHE_TTL_MS) {
      return cached.dept;
    }
    const forecast = await getMeteoFranceForecast(house.latitude, house.longitude);
    const dept = (forecast && forecast.position && forecast.position.dept) || null;
    deptByHouse[house.selector] = { dept, timestamp: Date.now() };
    return dept;
  }

  /**
   * @description Get a human readable forecast summary for a house, from the configured source.
   * @param {any} house - House object with latitude/longitude.
   * @param {number} days - Number of days in the summary (1 to 5).
   * @returns {Promise<object>} Today values and a multi-day summary text.
   * @example
   * const summary = await gladys.services.meteo.forecast.getSummaryForHouse(house, 2);
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
   * const vigilance = await gladys.services.meteo.vigilance.getForHouse(house);
   */
  async function getHouseVigilance(house) {
    if (meteoSource !== METEO_SOURCES.METEO_FRANCE) {
      throw new Error('Meteo: vigilance is only available with the Météo France source');
    }
    const dept = await getDeptForHouse(house);
    if (!dept) {
      throw new Error('Meteo: no department found for this house');
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
   * await gladys.services.meteo.vigilance.check();
   */
  async function checkVigilance() {
    if (meteoSource !== METEO_SOURCES.METEO_FRANCE) {
      return;
    }
    /** @type {Array<any>} */
    const houses = await gladys.house.get();
    await Promise.all(
      houses
        .filter((house) => house.latitude != null && house.longitude != null)
        .map(async (house) => {
          try {
            const dept = await getDeptForHouse(house);
            if (!dept) {
              return;
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
                `[Meteo] Vigilance raised from ${previousColor} to ${color} for house ${house.selector} (dept=${dept})`,
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
            logger.warn(`[Meteo] vigilance check failed for house ${house.selector}: ${message}`);
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
      logger.warn(`[Meteo] vigilance check failed: ${message}`);
    }
  }

  /**
   * @public
   * @description This function starts the service. With the Météo France source, forecast and
   * vigilance work without any configuration (the Météo France API key is optional and only
   * unlocks the vigilance map). With the OpenWeather source, an OpenWeather API key is required.
   * @example
   * gladys.services.meteo.start();
   */
  async function start() {
    logger.info('Starting Meteo service');
    meteoSource = (await gladys.variable.getValue(METEO_SOURCE_VAR, serviceId)) || METEO_SOURCES.METEO_FRANCE;
    meteoFranceApiKey = await gladys.variable.getValue(METEOFRANCE_API_KEY_VAR, serviceId);
    openWeatherApiKey = await gladys.variable.getValue(OPENWEATHER_API_KEY_VAR, serviceId);
    logger.info(`Meteo: forecast source is ${meteoSource}`);
    if (meteoSource === METEO_SOURCES.OPENWEATHER && !openWeatherApiKey) {
      logger.warn('Meteo: OpenWeather source selected but no API key configured, forecast will fail');
    }
    if (meteoSource === METEO_SOURCES.METEO_FRANCE && meteoFranceApiKey) {
      logger.info('Meteo: Météo France API key configured, vigilance map available');
    }
    // Poll vigilance to fire scene triggers; the first check records the baseline.
    // start() is called again when settings are saved: clear any previous timer first.
    // With the OpenWeather source, nothing is ever fetched from Météo France.
    if (vigilancePollTimer) {
      clearInterval(vigilancePollTimer);
      vigilancePollTimer = null;
    }
    if (meteoSource === METEO_SOURCES.METEO_FRANCE) {
      vigilancePollTimer = setInterval(safeCheckVigilance, VIGILANCE_POLL_INTERVAL_MS);
      safeCheckVigilance();
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.meteo.stop();
   */
  async function stop() {
    logger.info('Stopping Meteo service');
    if (vigilancePollTimer) {
      clearInterval(vigilancePollTimer);
      vigilancePollTimer = null;
    }
  }

  return Object.freeze({
    start,
    stop,
    getSource,
    controllers: MeteoController(gladys, getVigilance, getForecast, getVigilanceMap, getSource),
    vigilance: {
      get: getVigilance,
      getMap: getVigilanceMap,
      getForHouse: getHouseVigilance,
      check: checkVigilance,
    },
    forecast: {
      get: getForecast,
      getMeteoFrance: getMeteoFranceForecast,
      getOpenWeather: getOpenWeatherForecast,
      getSummaryForHouse: getForecastSummaryForHouse,
    },
  });
};
