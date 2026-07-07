const logger = require('../../../utils/logger');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { parseAlerts, parseVigilanceText } = require('../lib/vigilance.parser');

/**
 * @description Meteo service controllers.
 * @param {any} gladys - Gladys instance.
 * @param {Function} getVigilance - Vigilance fetch function.
 * @param {Function} getForecast - Forecast fetch function (source-aware, Météo France format).
 * @param {Function} getVigilanceMap - Vigilance map fetch function (optional API key).
 * @param {Function} getSource - Returns the configured forecast source.
 * @returns {object} Controllers routes map.
 */
module.exports = function MeteoController(gladys, getVigilance, getForecast, getVigilanceMap, getSource) {
  /**
   * @api {get} /api/v1/service/meteo/vigilance Get vigilance alerts
   * @param {any} req - Express request.
   * @param {any} res - Express response.
   */
  async function getVigilanceController(req, res) {
    const { dept } = req.query;
    if (!dept) {
      res.status(400).json({ message: 'DEPT_REQUIRED' });
      return;
    }
    const data = await getVigilance(dept);
    res.json({ alerts: parseAlerts(data, dept) });
  }

  /**
   * @api {get} /api/v1/service/meteo/vigilance/map Get national vigilance map image
   * @param {any} req - Express request.
   * @param {any} res - Express response.
   */
  async function getVigilanceMapController(req, res) {
    const image = await getVigilanceMap();
    if (!image) {
      res.status(404).json({ message: 'NO_API_KEY' });
      return;
    }
    res.json({ image });
  }

  /**
   * @api {get} /api/v1/house/:house_selector/meteo/weather Get weather for a house (configured source)
   * @param {any} req - Express request.
   * @param {any} res - Express response.
   */
  async function getHouseWeatherController(req, res) {
    const houseSelector = req.params.house_selector;
    const vigilanceRequested = `${req.query.vigilance}` === 'true';
    const source = getSource();

    const house = await gladys.house.getBySelector(houseSelector);
    if (house.latitude == null || house.longitude == null) {
      res.status(400).json({ message: 'HOUSE_HAS_NO_COORDINATES' });
      return;
    }

    let forecastData;
    try {
      forecastData = await getForecast(house.latitude, house.longitude);
    } catch (e) {
      // @ts-ignore: custom field set by the service when the OpenWeather key is missing
      if (e && e.code === 'OPENWEATHER_API_KEY_MISSING') {
        res.status(400).json({ message: 'OPENWEATHER_API_KEY_MISSING' });
        return;
      }
      const detail = e instanceof Error ? e.message : `${e}`;
      logger.warn(`[Meteo] getForecast (${source}) failed for (${house.latitude},${house.longitude}): ${detail}`);
      res.status(502).json({ message: 'FORECAST_API_ERROR', detail });
      return;
    }

    // Vigilance is a Météo France feature: it is only fetched with the Météo France
    // source (its forecast response already contains the department). With the
    // OpenWeather source, nothing is fetched from Météo France at all.
    /** @type {string|null} */
    const dept = (source === 'meteofrance' && forecastData.position && forecastData.position.dept) || null;
    /** @type {Array<object>} */
    let alerts = [];
    let text = '';
    if (vigilanceRequested && dept) {
      try {
        const warningData = await getVigilance(dept);
        alerts = parseAlerts(warningData, dept);
        if (alerts.length > 0) {
          text = parseVigilanceText(warningData);
        }
        logger.info(`[Meteo] vigilance alerts parsed: ${alerts.length} for dept=${dept}`);
      } catch (e) {
        const detail = e instanceof Error ? e.message : `${e}`;
        logger.warn(`[Meteo] vigilance fetch failed for dept=${dept}: ${detail}`);
      }
    }

    res.json({
      source,
      house: { name: house.name },
      forecast: forecastData,
      vigilance: { alerts, dept, text },
    });
  }

  return {
    'get /api/v1/service/meteo/vigilance': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceController),
    },
    'get /api/v1/service/meteo/vigilance/map': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceMapController),
    },
    'get /api/v1/house/:house_selector/meteo/weather': {
      authenticated: true,
      controller: asyncMiddleware(getHouseWeatherController),
    },
  };
};
