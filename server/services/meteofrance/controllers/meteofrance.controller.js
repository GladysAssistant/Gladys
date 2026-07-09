const logger = require('../../../utils/logger');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { parseAlerts, parseVigilanceText } = require('../lib/vigilance.parser');

/**
 * @description MeteoFrance service controllers.
 * @param {any} gladys - Gladys instance.
 * @param {Function} getVigilance - Vigilance fetch function.
 * @param {Function} getForecast - Forecast fetch function.
 * @param {Function} getVigilanceMap - Vigilance map fetch function (optional API key).
 * @returns {object} Controllers routes map.
 */
module.exports = function MeteoFranceController(gladys, getVigilance, getForecast, getVigilanceMap) {
  /**
   * @api {get} /api/v1/service/meteofrance/vigilance Get vigilance alerts
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
   * @api {get} /api/v1/service/meteofrance/vigilance/map Get national vigilance map image
   * @param {any} req - Express request.
   * @param {any} res - Express response.
   */
  async function getVigilanceMapController(req, res) {
    const day = req.query && req.query.day === 'J1' ? 'J1' : 'J';
    const image = await getVigilanceMap(day);
    if (!image) {
      res.status(404).json({ message: 'NO_API_KEY' });
      return;
    }
    res.json({ image });
  }

  /**
   * @api {get} /api/v1/house/:house_selector/meteofrance/weather Get Météo France weather for a house
   * @param {any} req - Express request.
   * @param {any} res - Express response.
   */
  async function getHouseWeatherController(req, res) {
    const houseSelector = req.params.house_selector;
    const vigilanceRequested = `${req.query.vigilance}` === 'true';

    const house = await gladys.house.getBySelector(houseSelector);
    if (house.latitude == null || house.longitude == null) {
      res.status(400).json({ message: 'HOUSE_HAS_NO_COORDINATES' });
      return;
    }

    let forecastData;
    try {
      forecastData = await getForecast(house.latitude, house.longitude);
    } catch (e) {
      const detail = e instanceof Error ? e.message : `${e}`;
      logger.warn(`[MeteoFrance] getForecast failed for (${house.latitude},${house.longitude}): ${detail}`);
      res.status(502).json({ message: 'FORECAST_API_ERROR', detail });
      return;
    }

    // The department is derived from the house coordinates through the forecast response
    const dept = (forecastData.position && forecastData.position.dept) || null;
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
        logger.info(`[MeteoFrance] vigilance alerts parsed: ${alerts.length} for dept=${dept}`);
      } catch (e) {
        const detail = e instanceof Error ? e.message : `${e}`;
        logger.warn(`[MeteoFrance] vigilance fetch failed for dept=${dept}: ${detail}`);
      }
    }

    res.json({
      source: 'meteofrance',
      house,
      forecast: forecastData,
      vigilance: { alerts, dept, text },
    });
  }

  return {
    'get /api/v1/service/meteofrance/vigilance': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceController),
    },
    'get /api/v1/service/meteofrance/vigilance/map': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceMapController),
    },
    'get /api/v1/house/:house_selector/meteofrance/weather': {
      authenticated: true,
      controller: asyncMiddleware(getHouseWeatherController),
    },
  };
};
